const syncPlugin = require('schemahandler/sync/sync-plugin-multi')
const syncFlow = require('schemahandler/sync/sync-flow')

module.exports = async function (cms) {
	const { orm } = cms
	// todo check this later
	orm.plugin(syncPlugin)
	orm.plugin(syncFlow)
	// cms.setMaster = function (_isMaster) {
	// 	// todo impl
	// }
	cms.emit('commit:flow:setMaster', true)
	orm.plugin(require('./orderCommit'))
}
