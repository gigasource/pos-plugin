const cmsFactory = require('./mockCms')
const syncFlow = require("schemahandler/sync/sync-flow");
const syncPlugin = require("schemahandler/sync/sync-plugin-multi");
const syncTransporter = require('schemahandler/sync/sync-transporter');
const { Socket, Io } = require('schemahandler/io/io')

async function syncFactory(testName, numberOfNode) {
	const cms = []
	for (let i = 0; i < numberOfNode; i++) {
		const _cms = cmsFactory(`${testName}${i}`)
		await _cms.init()
		_cms.orm.plugin(syncPlugin)
		_cms.orm.plugin(syncFlow)
		_cms.orm.plugin(syncTransporter)
		cms.push(_cms)
	}

	const masterIo = new Io()
	masterIo.listen('master')
	masterIo.on('connect', socket => {
		cms[0].orm.emit('initSyncForMaster', socket)
	})
	cms[0].orm.emit('commit:flow:setMaster', true)
	for (let i = 1; i < numberOfNode; i++) {
		const socket = new Socket()
		socket.connect('master')
		cms[i].orm.emit('initSyncForClient', socket)
	}
	return cms
}

module.exports = syncFactory
