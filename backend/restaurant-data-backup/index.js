const orm = require('schemahandler/orm')
const syncPlugin = require('schemahandler/sync/sync-plugin-multi')
const syncFlow = require('schemahandler/sync/sync-flow')
const syncTransporter = require('schemahandler/sync/sync-transporter')
const _ = require('lodash')
const { username, password, host } = global.APP_CONFIG.backupDatabaseConfig;
const backupDbConnectionUri = `mongodb://${username}:${password}@${host}`;

module.exports = async function (cms) {
	orm.setMultiDbMode()
	orm.plugin(syncPlugin)
	orm.plugin(syncFlow)
	orm.plugin(syncTransporter)
	orm.plugin(require('./collection-commit/orderCommit'))
	orm.plugin(require('./collection-commit/actionCommit'))
	orm.connect(backupDbConnectionUri, (err) => {
		if (err) {
			console.log('Error is:', err)
		}
	})

	cms.post('createStoreBackupDb', async () => {
		// todo implement this
	})

	cms.post('setMaster', async (_isMaster, dbName) => {
		orm.emit('commit:flow:setMaster', _isMaster, dbName)
	})

	const handleNewSocket = (socket, clientId, dbName) => {
		cms.getModel('Device').findById(clientId).then(device => {
			const _isMaster = orm.getMaster(device.storeId)

			if (_isMaster) {
				orm.emit('initSyncForMaster', socket, dbName)
			} else {
				if (device.master) {
					orm.emit('initSyncForClient', socket, dbName)
				}
			}
		})
	}

	cms.post('externalSocketIOServer', (externalSocketIOServer) => {
		externalSocketIOServer.on('connect', async socket => {
			if (socket.request._query && socket.request._query.clientId && !socket.request._query.demo) {
				const clientId = socket.request._query.clientId;
				const device = await cms.getModel('Device').findById(clientId)
				handleNewSocket(socket, clientId, device.storeId)
				socket.on('registerMasterDevice', async (ip) => {
					const masterDevice = await cms.getModel('Device').findOneAndUpdate({ _id: clientId }, { master: true, 'metadata.ip': ip})
					const devices = await cms.getModel('Device').find({ storeId: masterDevice.storeId, deviceType: { $ne: 'gsms' }, paired: true }).lean();
					devices.forEach(device => {
						externalSocketIOServer.emitToPersistent(device._id.toString(), 'updateMasterDevice');
					})
				})
				socket.on('getMasterIp', async (storeAlias, fn) => {
					const store = await cms.getModel('Store').findOne({ alias: storeAlias });
					if (!store) return fn(null, null);
					const device = await cms.getModel('Device').findOne({ storeId: store._doc._id, paired: true, master: true }).lean();
					if (!device) return fn(null, null);
					fn(device.metadata ? device.metadata.ip : null, device._id.toString());
				})
			}
		})
	})

	cms.dbExists = async (dbName) => {
		return (await orm('Order', dbName).count()) !== 0
	}

	const storesList = await cms.getModel('Store').find({}).lean();
	for (let id = 0; id < storesList.length; id++) {
		const store = storesList[id];
		const devices = await cms.getModel('Device').find({ _id: store._id }).lean();
		const masterDevice = _.find(devices, device => device.master);
		if (!masterDevice) {
			orm.emit('commit:flow:setMaster', true, store._id)
		}
	}
}
