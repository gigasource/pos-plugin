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

const uuid = require('uuid')

global.APP_CONFIG = {
	deviceIp: 'a.b.c.d'
}

const mapSocket = {}

function cmsFactory(orm) {
	const io = new Io()
	let posSetting = {
		masterIp: null,
		onlineDevice: {
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

// return a abstract object
jest.mock('socket.io-client', () => {
	return {
		connect: function () {
			return {
				on: function () {},
				emit: function () {},
				removeAllListeners: function () {}
			}
		}
	}
})

// Note: This test does not use the default transport layer
describe('test online socket transport layer', function () {
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
			socket.on('getMasterIp', (storeId, ack) => {
				if (socket.name) {
					ack('a.b.c.d', 'orm')
				} else {
					ack('d.e.f.t', 'orm')
				}
			})
			if (socket.name) {
				mapSocket[socket.name] = socket
			} else {
				mapSocket[uuid.v4()] = socket
			}
		})

		clientToOnlineSocket.connect('local?clientId=orm', 'fromMaster')
		clientToOnlineSocketB.connect('local?clientId=B')
	})

	it('flow', async (done) => {
		const ormSocket = mapSocket['fromMaster']
		await require('./index')(cms)
		await cms.execPostAsync('onlineOrderSocket', null, [clientToOnlineSocket])
		ormSocket.emit('setDeviceAsMaster', () => {})
		ormSocket.on('transport:cloud:sync', () => {
			Object.keys(mapSocket).forEach(key => {
				if (key !== 'fromMaster') {
					mapSocket[key].emit('transport:cloud:sync', () => {})
				}
			})
		})
		ormA.emit('initSyncForClient', ormSocket)
		await delay(50)

		/*
		Pair new orm
		 */
		await require('./index')(cms1)
		await cms1.execPostAsync('onlineOrderSocket', null, [clientToOnlineSocketB])
		await delay(50)

		/*
		Create a commit
		 */

		await ormB('Order').create({
			table: 9
		})
		let docB = await ormB('Order').find({})
		expect(stringify(docB)).toMatchSnapshot()
		await delay(50)
		docB = await ormB('Order').find({})
		let doc = await orm('Order').find({})
		let docA = await ormA('Order').find({})
		expect(stringify(docB)).toMatchSnapshot()
		expect(docB).toEqual(doc)
		expect(docA).toEqual(doc)

		done()
	}, 30000)
})
