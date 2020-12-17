const syncPlugin = require('schemahandler/sync/sync-plugin-multi')
const syncFlow = require('schemahandler/sync/sync-flow')
const syncTransporter = require('schemahandler/sync/sync-transporter')
const internalIp = require('internal-ip')
const socketClient = require('socket.io-client')
const _ = require('lodash')

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
		cms.emit('commit:flow:setMaster', _isMaster)
	}
	cms.setMaster = setMaster
	const localIp = function () {
		return global.APP_CONFIG.deviceIp ? global.APP_CONFIG.deviceIp : internalIp.v4.sync()
	}

	cms.post('connectToMaster', async function (_masterIp, onlineOrderSocket) {
		const posSettings = await cms.getModel('PosSetting').findOne({})
		let { masterIp } = posSettings
		if (_masterIp && masterIp !== _masterIp) {
			masterIp = _masterIp
			await cms.getModel('PosSetting').findOneAndUpdate({}, { masterIp })
			const _isMaster = cms.getMaster()
			if (_isMaster) {
				orm.emit('offMaster')
			} else {
				orm.emit('offClient')
			}
		}
		if (!masterIp) return // cloud is master
		if (masterIp === localIp()) {
			setMaster(true)
			if (onlineOrderSocket) onlineOrderSocket.emit('registerMasterDevice', localIp())
			const masterSocket = cms.io.of('/masterNode')
			masterSocket.on('connect', socket => {
				orm.emit('initSocketForMaster', socket)
			})
		} else {
			const clientSocket = socketClient.connect(`http://${masterIp}/masterNode`)
			orm.emit('initSocketForClient', clientSocket)
			const {value: highestId} = await orm.emit('getHighestCommitId')
			orm.emit('transport:require-sync', highestId)
		}
	})

	/*
	 -------------------------------------------
	 */
	cms.post('onlineOrderSocket', _.once(async function (socket) {
		const posSettings = await cms.getModel('PosSetting').findOne({}).lean()
		const { onlineDevice, masterIp } = posSettings
		if (!onlineDevice.store) return
		const getMasterIp = function () {
			socket.emit('getMasterIp', onlineDevice.store.alias, async (_masterIp, masterClientId) => {
				if (masterIp !== _masterIp) {
					await cms.execPostAsync('connectToMaster', null, [_masterIp, socket])
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
			await cms.execPostAsync('connectToMaster', null, [localIp(), socket])
		})

		if (!masterIp) {
			orm.emit('initSyncForClient', socket)
			const {value: highestId} = await orm.emit('getHighestCommitId')
			orm.emit('transport:require-sync', highestId)
		} else {
			// todo impl case through online
		}
	}))

	/*
	 -------------------------------------------
	 */
	await cms.execPostAsync('connectToMaster')

	orm.plugin(require('./orderCommit'))
}
