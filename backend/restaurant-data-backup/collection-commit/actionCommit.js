const _ = require('lodash')

module.exports = async function (orm) {
	if (orm.mode !== 'multi') {
		let onlineDevice

		orm.on('getOnlineDevice', _.once(function (_onlineDevice) {
			onlineDevice = _onlineDevice
		}))

		orm.on('commit:handler:finish:Action', async function (action, commit) {
			if (commit.data.printFromClient && onlineDevice && commit.from === onlineDevice.id) {
				await cms.execPostAsync('run:print', null, [action])
			} else if (commit.data.printFromMaster) {
				await cms.execPostAsync('run:print', null, [action])
			}
		})

		orm.on('commit:auto-assign:Action', async function (commit) {
			if (!onlineDevice || !onlineDevice.id) {
				console.error('No clientId found for this device')
				return
			}
			if (!onlineDevice.id) {
				return console.error('Error while assign for action commit: No clientId is found')
			}
			commit.from = onlineDevice.id
		})
	}

	orm.on('process:commit', async function (commit) {
		// do nothing
		this.value = commit
	})

	orm.on('process:commit:print', async function (commit) {
		if (orm.mode === 'single' && orm.getMaster()) {
			commit.data.printFromMaster = true
		} else {
			if (orm.mode === 'multi' && commit.dbName && orm.getMaster(commit.dbName)) {
				commit.data.printFromClient = true
			}
		}
	})
}
