const { Socket, Io } = require('schemahandler/io/io')
const _ = require('lodash')
const Hooks = require('schemahandler/hooks/hooks');
const delay = require('delay')
const onlineOrderIo = new Io()
onlineOrderIo.listen('local')
onlineOrderIo.masterIp = null
const orm = require("schemahandler/orm")
const { stringify } = require("schemahandler/utils");
orm.name = 'orm'
const syncFlow = require("schemahandler/sync/sync-flow");
const syncPlugin = require("schemahandler/sync/sync-plugin-multi");
const syncTranspoter = require('schemahandler/sync/sync-transporter')
const clientToOnlineSocket = new Socket()
const uuid = require('uuid')
const ObjectID = require('bson').ObjectID

let socketToOrm
let fakeCommit

const posSetting = {
	onlineDevice: {
		id: uuid.v4()
	}
}

const cms = {
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
_.extend(cms, new Hooks())

describe('test-action-commit', function () {
	beforeAll(async () => {
		orm.connect({uri: "mongodb://localhost:27017"}, "myproject");
		orm.registerSchema("Order", {
			inProgress: Boolean,
			items: [{}],
			table: Number
		});
		await orm('Action').deleteMany().direct()
		await orm('Commit').deleteMany().direct()
		orm.plugin(syncPlugin)
		orm.plugin(syncFlow)
		orm.plugin(syncTranspoter)
		orm.plugin(require('./actionCommit'), cms)
		orm.registerCommitBaseCollection('Action')

		onlineOrderIo.on('connect', socket => {
			let commits = []
			socketToOrm = socket
			socket.on('commitRequest', commit => {
				commit.data.printFromClient = true
				fakeCommit = _.cloneDeep(commit)
				fakeCommit.from = uuid.v4()
				commits.push(commit)
				fakeCommit._id = new ObjectID()
				fakeCommit.chain = JSON.stringify([])
				commits.push(fakeCommit)
				socket.emit('transport:sync')
			})
			socket.on('transport:require-sync', function ([clientHighestId = 0], cb) {
				cb(commits)
				commits = []
			})
		})

		orm.emit('getOnlineDevice', posSetting.onlineDevice)
		clientToOnlineSocket.connect('local', 'fromClient')
		orm.emit('initSyncForClient', clientToOnlineSocket)
	})

	it('print', async (done) => {
		let count = 0;
		let actions = []
		cms.on('run:print', (action) => {
			actions.push(action)
			count++
		})

		// print as client
		await orm('Action').create({
			printType: 'kitchenAdd',
			order: {
				table: 10,
				items: [{
					name: 'fanta'
				}]
			}
		}).commit('print')
		await delay(50)
		// printAsMaster
		orm.emit('offClient')
		orm.emit('commit:flow:setMaster', true)
		await orm('Action').create({
			printType: 'kitchenAdd',
			order: {
				table: 10,
				items: [{
					name: 'fanta'
				}]
			}
		}).commit('print')

		await delay(100)
		expect(count).toEqual(2)
		expect(stringify(actions)).toMatchSnapshot()
		done()
	}, 30000)
})
