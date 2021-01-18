const syncPlugin = require('schemahandler/sync/sync-plugin-multi')
const syncFlow = require('schemahandler/sync/sync-flow')
const syncTransporter = require('schemahandler/sync/sync-transporter')
const internalIp = require('internal-ip')
const socketClient = require('socket.io-client')
const _ = require('lodash')

let cloudSocket

module.exports = async function (cms) {
	const { orm } = cms
	// todo check this later
	orm.plugin(syncPlugin)
	orm.plugin(syncFlow)
	orm.plugin(syncTransporter)
	orm.registerCommitBaseCollection(
		'Order',
		'Category',
		'Customer',
		'GroupPrinter',
		'OrderLayout',
		'PosPopupModifier',
		'Product',
		'VirtualReport',
		'Room',
		'Inventory',
		'InventoryCategory',
		'InventoryHistory',
		'EndOfDay'
	)

	const setMaster = function (_isMaster) {
		orm.emit('commit:flow:setMaster', _isMaster)
	}
	cms.setMaster = setMaster
	const localIp = function () {
		return global.APP_CONFIG.deviceIp ? global.APP_CONFIG.deviceIp : internalIp.v4.sync()
	}

	cms.on('connectToMaster', async function (_masterIp, _masterClientId, cloudSocket) {
		const posSettings = await cms.getModel('PosSetting').findOne({})
		let { masterIp } = posSettings
		if (posSettings.onlineDevice)
			orm.emit('getOnlineDevice', posSettings.onlineDevice)
		if (_masterIp && masterIp !== _masterIp) {
			masterIp = _masterIp
			await cms.getModel('PosSetting').findOneAndUpdate({}, { masterIp, masterClientId: _masterClientId })
			const _isMaster = orm.getMaster()
			if (_isMaster) {
				orm.emit('offMaster')
			} else {
				orm.emit('offClient')
			}
			if (masterIp === localIp()) {
				setMaster(true)
			}
			await orm.emit('setUpCloudSocket', _masterIp, _masterClientId, cloudSocket)
		}
		if (!masterIp) return // cloud is master
		if (orm.getMaster()) {
			if (cloudSocket) cloudSocket.emit('registerMasterDevice', localIp())
			const masterSocket = cms.io.of('/masterNode')
			masterSocket.on('connect', socket => {
				orm.emit('initSyncForMaster', socket)
			})
		} else {
			const clientSocket = socketClient.connect(`http://${masterIp}/masterNode`)
			orm.emit('initSyncForClient', clientSocket)
			const {value: highestId} = await orm.emit('getHighestCommitId')
			orm.emit('transport:require-sync', highestId)
		}
	})

	orm.on('setUpCloudSocket', async function (masterIp, masterClientId, cloudSocket) {
		if (!cloudSocket) return
		if (!masterIp) {
			orm.emit('initSyncForClient', cloudSocket)
			const {value: highestId} = await orm.emit('getHighestCommitId')
			orm.emit('transport:require-sync', highestId)
		} else {
			// todo impl case through online
			orm.setMasterClientIdCloud(masterClientId)
			if (orm.getMaster()) {
				orm.emit('initSyncForMaster', cloudSocket)
				orm.emit('initSyncForMasterCloud', cloudSocket)
			} else {
				orm.emit('initSyncForClientCloud', cloudSocket)
			}
		}
	})

	orm.on('commit:handler:finish', function (commit) {
		if (cms.socket) {
			if (commit.collectionName === 'Order') {
				cms.socket.emit('update-table-status')
			} else if (commit.collectionName === 'Product') {
				cms.socket.emit('updateProductProps')
			}	else if (commit.collectionName === 'Room') {
				cms.socket.emit('updateRooms')
			} else if (commit.collectionName === 'OrderLayout') {
				cms.socket.emit('updateOrderLayouts')
			}
		}
		if (commit.collectionName === 'Order' && commit.tags.includes('closeOrder')) {
			cms.emit('run:closeOrder')
		}
	})

	/*
	 -------------------------------------------
	 */
	cms.on('onlineOrderSocket', async function (socket) {
		if (socket === cloudSocket) return
		cloudSocket = socket
		const posSettings = await cms.getModel('PosSetting').findOne({})
		let { onlineDevice, masterIp, masterClientId } = posSettings
		if (posSettings.onlineDevice)
			orm.emit('getOnlineDevice', posSettings.onlineDevice)
		if (!onlineDevice.store) return
		const getMasterIp = function () {
			socket.emit('getMasterIp', onlineDevice.store.alias, async (_masterIp, masterClientId) => {
				if (_masterIp && masterIp !== _masterIp) {
					await cms.emit('connectToMaster', _masterIp, masterClientId, socket)
				}
			})
		}

		getMasterIp()

		socket.on('updateMasterDevice', async function (ack) {
			ack()
			getMasterIp()
		})

		socket.on('setDeviceAsMaster', async function (ack) {
			ack()
			masterIp = localIp()
			await cms.emit('connectToMaster', localIp(), onlineDevice.id, socket)
		})

		await orm.emit('setUpCloudSocket', masterIp, masterClientId, socket)
	})

	/*
	 -------------------------------------------
	 */
	await cms.emit('connectToMaster')

	orm.plugin(require('./orderCommit'))
	orm.plugin(require('./actionCommit'))
	orm.plugin(require('./onlineSocketTransportLayer'))
}
