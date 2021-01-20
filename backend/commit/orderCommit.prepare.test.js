function prepareOrderCommit(cms) {
	const { orm } = cms
	orm.registerCommitBaseCollection("Order")
	require('./orderCommit')(cms)
}

module.exports ={
	prepareOrderCommit
}
