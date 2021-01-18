function prepareActionCommitTest(cms) {
	const { orm } = cms
	orm.registerCommitBaseCollection('Action')
	orm.plugin(require('./actionCommit'))
}

module.exports = {
	prepareActionCommitTest
}
