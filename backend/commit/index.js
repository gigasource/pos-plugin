module.exports = async function (cms) {
	const { orm } = cms
	// todo check this later
	orm.plugin(syncPlugin)
	cms.setMaster = function (_isMaster) {
		// todo impl
	}
	orm.plugin(require('./orderCommit'))
}
