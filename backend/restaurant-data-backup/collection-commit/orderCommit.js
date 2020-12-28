const _ = require('lodash')

module.exports = async function (orm) {
	const checkActiveOrder = async function (table, dbName) {
		if (!table) return false
		const activeOrder = await orm('Order', dbName).findOne({
			table,
			status: 'inProgress'
		})
		return activeOrder ? activeOrder : false
	}

	const buildDoNothingCommit = async function (commit, dbName) {
		commit.id = (await orm.emit('getHighestCommitId', dbName)).value + 1
		commit.approved = false
		delete commit.chain
	}

	orm.on('process:commit', async function (commit) {
		// do nothing
		this.value = commit
	})

	orm.on('commit:auto-assign:Order', function (commit, _query, target) {
		const table = _.get(_query, 'chain[0].args[0].table')
		if (table) commit.data.table = table
		if (commit.tags.includes('changeTable')) {
			if (!commit.data.newTable)
				commit.data.newTable = _.get(_query, 'chain[0].args[1].$set.table')
			if (commit.tags.includes('updateActiveOrder'))
				commit.tags.push('updateActiveOrder')
		}
	})

	orm.on('process:commit:splitOrder', function (commit) {
		// do nothing
		this.value = commit
	})

	orm.on('process:commit:createOrder', async function (commit) {
		if (await checkActiveOrder(commit.data.table, commit.dbName)) {
			await buildDoNothingCommit(commit, commit.dbName)
		}
		this.value = commit
	})

	orm.on('process:commit:updateActiveOrder', async function (commit) {
		if (!(await checkActiveOrder(commit.data.table, commit.dbName))) {
			await buildDoNothingCommit(commit, commit.dbName)
		}
		this.value = commit
	})

	orm.on('process:commit:changeTable', async function (commit) {
		if (!(await checkActiveOrder(commit.data.table, commit.dbName))) {
			await buildDoNothingCommit(commit, commit.dbName)
		}
		if (await checkActiveOrder(commit.data.newTable, commit.dbName)) {
			await buildDoNothingCommit(commit, commit.dbName)
		}
		this.value = commit
	})
}
