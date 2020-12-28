const { Socket, Io } = require('schemahandler/io/io')
const Kareem = require('kareem')
const orm = require('schemahandler/orm') // cloud orm
orm.name = 'orm'
const ormA = new orm()
ormA.name = 'A'
const ormB = new orm()
ormB.name = 'B'
const ormC = new orm() // this is normal db on cloud
ormC.name = 'C'
const syncFlow = require("schemahandler/sync/sync-flow");
const syncPlugin = require("schemahandler/sync/sync-plugin-multi");
const syncTransporter = require('schemahandler/sync/sync-transporter')
const uuid = require('uuid')
const _ = require('lodash')
const ObjectID = require('bson').ObjectID
const delay = require('delay')
const { stringify } = require("schemahandler/utils");

const deviceId1 = new ObjectID()
const deviceId2 = new ObjectID()
const storeId = new ObjectID('5fe19d5d8874f8535e2acb14')

const externalSocketIo = new Io()
const socketA = new Socket()
const socketB = new Socket()

global.APP_CONFIG = {
	backupDatabaseConfig: {
		host: 'localhost:27017'
	}
}

const cms = {
	getModel: function (modelName) {
		return ormC(modelName)
	}
}

_.extend(cms, new Kareem())
cms.execPostAsync = async function(name, context, args) {
	const posts = this._posts.get(name) || [];
	const numPosts = posts.length;

	for (let i = 0; i < numPosts; ++i) {
		await posts[i].fn.bind(context)(...(args || []));
	}
};

let mapSockets = {}

describe('test flow', function () {
	beforeAll(async function () {
		ormA.connect({uri: "mongodb://localhost:27017"}, "myproject1");
		ormB.connect({uri: "mongodb://localhost:27017"}, "myproject2");
		ormC.connect({uri: "mongodb://localhost:27017"}, "myproject3");

		await ormC('Store').remove({})
		await ormC('Device').remove({})
		await ormC('Store').create({
			_id: storeId,
			name: 'myStore',
			alias: 'myStore'
		})
		await ormC('Device').create({
			_id: deviceId1,
			storeId,
			name: 'device1',
			paired: true
		})
		await ormC('Device').create({
			_id: deviceId2,
			storeId,
			name: 'device2',
			paired: true
		})

		const orms = [ormA, ormB]
		for (let orm of orms) {
			orm.registerSchema("Order", {
				inProgress: Boolean,
				items: [{}],
				table: Number
			});
			await orm('Order').deleteMany()
			await orm('Commit').deleteMany()
		}

		for (let orm of [ormA, ormB]) {
			orm.plugin(syncPlugin)
			orm.plugin(syncFlow)
			orm.plugin(syncTransporter)
		}

		externalSocketIo.listen('local')
		externalSocketIo.on('connect', socket => {
			mapSockets[socket.name] = socket
			socket.request = {
				_query: {
					clientId: socket.clientId
				}
			}
		})
		externalSocketIo.emitToPersistent = function (target, ...args) {
			Object.keys(mapSockets).forEach(key => {
				if (mapSockets[key].clientId === target) {
					mapSockets[key].emit(...args)
				}
			})
		}

		// init cloud
		await require('./index')(cms)
		await orm('Order', storeId.toString()).remove().direct()
		await orm('Commit', storeId.toString()).remove().direct()
		cms.execPostSync('externalSocketIOServer', null, [externalSocketIo])
		// 2 client connect to cloud
		socketA.connect(`local?clientId=${deviceId1.toString()}`, 'fromA')
		socketB.connect(`local?clientId=${deviceId2.toString()}`, 'fromB')
		await delay(300)
		ormA.emit('initSyncForClient', socketA)
		ormB.emit('initSyncForClient', socketB)
	})

	afterEach(async () => {
		await orm('Order', storeId.toString()).remove().direct()
		await orm('Commit', storeId.toString()).remove().direct()
	})

	it('flow client -> cloud as master -> client', async (done) => {
		// create order
		let order = await ormA('Order').create({
			table: 10
		}).commit('createOrder', { table: 10 })
		await delay(10)
		// update order
		await ormA('Order').findOneAndUpdate({
			_id: order._id
		}, {
			$push: {
				items: {
					name: 'fanta'
				}
			}
		}).commit('updateActiveOrder', { table: 10 })
		await delay(10)
		// can run through commit plugins
		await ormA('Order').create({
			table: 10
		}).commit('createOrder', { table: 10 })

		await delay(100)
		// expect db must be equal
		let doc = await orm('Order', storeId.toString()).find({})
		let docA = await ormA('Order').find({})
		let docB = await ormB('Order').find({})
		expect(stringify(doc)).toMatchSnapshot()
		expect(doc).toEqual(docA)
		expect(doc).toEqual(docB)
		let commit = await orm('Commit').find({})
		expect(commit).toMatchSnapshot()
		done()
	}, 60000)

	it('flow client -> cloud -> master and master -> cloud -> client', async (done) => {
		genTransporter(ormA)
		genTransporter(ormB)
		// setMaster for a device, all commit will go through cloud
		await cms.execPostAsync('setDeviceAsMaster', null, [deviceId1])
		ormA.emit('offClient')
		ormA.emit('initSyncForMaster', socketA)
		ormA.emit('initSyncForMasterCloud', socketA)
		ormA.emit('commit:flow:setMaster', true)
		ormB.emit('offClient')
		ormB.emit('initSyncForClientCloud', socketB)
		ormB.setMasterClientIdCloud(deviceId1.toString())
		let masterIp = '192.168.10.189'
		const hookUpdateMasterDevicePromise = new Promise((resolve) => {
			let count = 0
			socketA.on('updateMasterDevice', () => {
				count++
				if (count == 2) resolve()
			})
			socketB.on('updateMasterDevice', () => {
				count++
				if (count == 2) resolve()
			})
		})
		socketA.emit('registerMasterDevice', masterIp)
		await hookUpdateMasterDevicePromise
		await new Promise(resolve => {
			socketB.emit('getMasterIp', 'myStore', (deviceIp, deviceId) => {
				expect(deviceIp).toEqual(masterIp)
				expect(deviceId).toEqual(deviceId1.toString())
				resolve()
			})
		})
		await delay(50)
		// expect master of db must be false and offMaster is called
		expect(orm.getMaster(storeId)).toEqual(false)
		expect(orm._events['master:transport:sync']).toBe(undefined)

		// can create new order
		let order = await ormA('Order').create({
			table: 9
		}).commit('creatOrder', { table: 9 })
		await delay(50)
		order = await ormB('Order').findOneAndUpdate({
			_id: order._id
		}, {
			$push: {
				items: {
					name: 'fanta'
				}
			}
		}).commit('updateActiveOrder', { table: 9 })
		expect(stringify(order)).toMatchSnapshot()
		await delay(50)
		let docA = await ormA('Order').find({})
		let docB = await ormB('Order').find({})
		let doc = await orm('Order', storeId.toString()).find({})
		expect(stringify(docA)).toEqual(stringify(docB))
		expect(stringify(doc)).toEqual(stringify(docA))
		done()
	}, 10000)
})

// this is copy from client
function genTransporter(orm) {
	let masterClientId = null

	orm.setMasterClientIdCloud = function (_masterClientId) {
		masterClientId = _masterClientId
	}

	//todo: layer transport implement
	orm.on('initSyncForClientCloud', (clientSocket, dbName) => {
		const off1 = orm.onQueue('transport:toMaster', async (commit, _dbName) => {
			if (!masterClientId) return
			if (dbName !== _dbName) return
			clientSocket.emitTo(masterClientId, 'commitRequestCloud', commit)
		}).off

		clientSocket.on('transport:cloud:sync',  async () => {
			if (!masterClientId) return
			const {value: highestId} = await orm.emit('getHighestCommitId', dbName);
			orm.emit('transport:cloud:require-sync', highestId);
		})

		const off2 = orm.onQueue('transport:cloud:require-sync', (highestId) => {
			if (!masterClientId) return
			const args = [highestId];
			orm.emit('commit:sync:args', args);
			clientSocket.emitTo(masterClientId, 'transport:cloud:require-sync', args, async (commits) => {
				commits.forEach(commit => commit.dbName = dbName)
				await orm.emit('transport:requireSync:callback', commits)
			})
		}).off

		orm.on('offClient', (_dbName) => {
			if (dbName !== _dbName) return
			off1()
			off2()
			clientSocket.removeAllListeners('transport:cloud:sync');
		})
	})

	orm.on('initSyncForMasterCloud', (socket, dbName) => {
		const off1 = orm.on('master:transport:sync', (id, _dbName) => {
			if (dbName !== _dbName) return
			socket.emit('transport:cloud:sync')
		}).off;

		socket.on('commitRequestCloud', async (commit) => {
			commit.dbName = dbName
			await orm.emit('commitRequest', commit);
		});

		socket.on('transport:cloud:require-sync', async function ([clientHighestId = 0], cb) {
			const {value: commits} = await orm.emit('commit:sync:master', clientHighestId, dbName);
			cb(commits);
		});

		orm.on('offMaster', (_dbName) => {
			if (dbName !== _dbName) return
			off1()
			socket.removeAllListeners('commitRequestCloud')
			socket.removeAllListeners('transport:cloud:require-sync')
		})
	})
}
