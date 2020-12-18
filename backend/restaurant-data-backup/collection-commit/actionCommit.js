module.exports = function (orm) {
	orm.on('process:commit', async function (commit) {
		// do nothing
		this.value = commit
	})

	orm.on('process:commit:print', async function (commit) {
		if (orm.mode() === 'single' && orm.getMaster()) {
			await cms.execPostAsync('run:print', null, [commit])
		} else {
			if (orm.mode() === 'multi' && commit.dbName && orm.getMaster(commit.dbName)) {
				commit.data.printFromClient = true
			} else if (orm.mode() === 'single' && commit.data && commit.data.printFromClient) {
				await cms.execPostAsync('run:print', null, [commit])
			}
		}
	})
}
