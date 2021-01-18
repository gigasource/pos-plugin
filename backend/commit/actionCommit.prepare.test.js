const Hooks = require('schemahandler/hooks/hooks')

if (!global.globalHooks) {
	global.globalHooks = new Hooks()
}

global.globalHooks.on('prepare:ActionCommit', function (cms) {
	const { orm } = cms
	orm.registerCommitBaseCollection('Action')
	orm.plugin(require('./actionCommit'))
})
