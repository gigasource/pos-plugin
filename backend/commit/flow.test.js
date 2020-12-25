const { Socket, Io } = require('schemahandler/io/io')
const _ = require('lodash')
const Kareem = require('kareem');
const delay = require('delay')
const onlineOrderIo = new Io()
onlineOrderIo.listen('local')
onlineOrderIo.masterIp = null
const orm = require("schemahandler/orm")
const { stringify } = require("schemahandler/utils");
orm.name = 'orm'
const ormA = new orm() // online-order Orm
ormA.name = 'A'
const ormB = new orm()
ormB.name = 'B'
const syncFlow = require("schemahandler/sync/sync-flow");
const syncPlugin = require("schemahandler/sync/sync-plugin-multi");
const syncTransporter = require('schemahandler/sync/sync-transporter')
const clientToOnlineSocket = new Socket()
const clientToOnlineSocketB = new Socket()
const mockSocket = []
for (let i = 0; i < 3; i++) {
	mockSocket.push(new Socket())
}
const uuid = require('uuid')

global.APP_CONFIG = {
}

const mapSocket = {}

function cmsFactory(orm) {
	const io = new Io()
	let posSetting = {
		masterIp: null,
		onlineDevice: {
			id: uuid.v4(),
			store: 'myStore'
		}
	}
	let countOf = 0
	let cms = {
		io: {
			of: function () {
				countOf++
				return io
			}
		},
		getIo: function () {
			return io
		},
		getCountOf: function () {
			return countOf
		},
		orm,
		getModel: function (modelName) {
			if (modelName === 'PosSetting') {
				return {
					findOne: function () {
						return posSetting
					},
					findOneAndUpdate: function (condition, value) {
						posSetting.masterIp = value
					}
				}
			}
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
	return cms
}

const cms = cmsFactory(orm)
const cms1 = cmsFactory(ormB)

jest.mock('socket.io-client', () => {
	let i = 0
	return {
		connect: function (target) {
			i++
			mockSocket[i - 1].connect(target, 'mockSocket')
			return mockSocket[i - 1]
		}
	}
})

describe('test-flow', function () {
	beforeAll(async () => {
		orm.connect({uri: "mongodb://localhost:27017"}, "myproject");
		ormA.connect({uri: "mongodb://localhost:27017"}, "myproject1");
		ormB.connect({uri: "mongodb://localhost:27017"}, "myproject2");
		const orms = [orm, ormA, ormB]
		for (let orm of orms) {
			orm.registerSchema("Order", {
				inProgress: Boolean,
				items: [{}],
				table: Number
			});
			await orm('Order').deleteMany()
			await orm('Commit').deleteMany()
		}

		for (let orm of [ormA]) {
			orm.plugin(syncPlugin)
			orm.plugin(syncFlow)
			orm.plugin(syncTransporter)
		}

		onlineOrderIo.on('connect', socket => {
			ormA.emit('initSyncForMaster', socket)
			socket.on('getMasterIp', (storeId, ack) => {
				if (socket.name) {
					ack(global.APP_CONFIG.deviceIp, null)
				} else {
					ack(onlineOrderIo.masterIp, null)
				}
			})
			if (socket.name) {
				mapSocket[socket.name] = socket
			} else {
				mapSocket[uuid.v4()] = socket
			}
		})

		clientToOnlineSocket.connect('local', 'fromClient')
		clientToOnlineSocketB.connect('local')
	})

	it('flow', async (done) => {
		let countInitSyncForClient = 0
		let countInitSyncForClientB = 0
		orm.onCount('initSyncForClient', function (_count) {
			countInitSyncForClient = _count
		})
		ormB.onCount('initSyncForClient', function (_count) {
			countInitSyncForClientB = _count
		})
		await require('./index')(cms)
		await delay(50)
		expect(orm.getMaster()).toEqual(false)
		expect(countInitSyncForClient).toEqual(0)
		/*
		after connect to master for the first time, expect master is false
		and initSocketForClient hook has not been called
		 */
		await cms.execPostAsync('onlineOrderSocket', null, [clientToOnlineSocket])
		await delay(50)
		expect(countInitSyncForClient).toEqual(1)
		expect(orm._events['transport:toMaster']).not.toBe(undefined)

		/*
		Do a create query
		 */
		await orm('Order').create({ table: 10 })
		await delay(50)
		let doc = await orm('Order').find({})
		let docA = await ormA('Order').find({})
		expect(doc).toEqual(expect.anything())
		expect(doc).toEqual(docA)

		/*
		Pair new orm
		 */
		await require('./index')(cms1)
		await cms1.execPostAsync('onlineOrderSocket', null, [clientToOnlineSocketB])
		await delay(50)
		expect(countInitSyncForClientB).toBe(1)
		expect(ormB._events['transport:toMaster']).not.toBe(undefined)
		expect(ormB.getMaster()).toEqual(false)
		let docB = await orm('Order').find({})
		expect(docB).toEqual(doc)

		/*
		Set master for orm
		 */
		// set io server for orm
		cms.getIo().listen('http://q.w.e.r/masterNode')
		global.APP_CONFIG.deviceIp = 't.e.s.t'
		const ormSocket = mapSocket['fromClient']
		ormA.emit('offMaster')
		ormA.emit('initSyncForClient', ormSocket)
		const registerDevicePromise = new Promise(resolve => {
			ormSocket.on('registerMasterDevice', (deviceIp) => {
				onlineOrderIo.masterIp = 'q.w.e.r' // if deviceIp is set, ormB will have the same ip so both will become master
				Object.keys(mapSocket).forEach(key => {
					mapSocket[key].emit('updateMasterDevice', () => {})
				})
				resolve(deviceIp)
			})
		})
		await new Promise((resolve) => {
			ormSocket.emit('setDeviceAsMaster', () => {
				resolve()
			})
		})
		await delay(50)
		const ip = await registerDevicePromise
		expect(orm.getMaster()).toEqual(true)
		expect(ormB.getMaster()).toEqual(false)
		expect(ormB._events['transport:toMaster']).not.toBe(undefined)
		expect(orm._events['transport:toMaster']).toBe(undefined)
		expect(cms.getCountOf()).toBe(1)
		expect(cms.getIo().sockets.size).toBe(1)

		/*
		Flow when master is disconnect and then reconnect
		and create query can be synced
		 */

		const toMasterLockB = ormB.getLock('transport:toMaster')
		await toMasterLockB.acquireAsync()

		await ormB('Order').create({
			table: 9
		})
		docB = await ormB('Order').find({})
		expect(stringify(docB)).toMatchSnapshot()
		toMasterLockB.release()
		await delay(50)
		docB = await ormB('Order').find({})
		doc = await orm('Order').find({})
		docA = await ormA('Order').find({})
		expect(stringify(docB)).toMatchSnapshot()
		expect(docB).toEqual(doc)
		expect(docA).toEqual(doc)

		done()
	}, 30000)
})
