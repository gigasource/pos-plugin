const _ = require('lodash')
const uuid = require('uuid')
const jsonFn = require('json-fn')

module.exports = async function (orm, cms) {
	//todo: need to understand logic here to refactor
	orm.registerCommitBaseCollection('Action')

	const Action = orm('Action')
	cms.emitAction = async (action, ...args) => {
		const actionId = uuid.v4()
		const cb = typeof _.last(args) === 'function' ? _.last(args) : null
		orm.once(`action:${actionId}`, function () {
			this.value = cb
		})
		await Action.create({
			eventName: action,
			args: jsonFn.stringify(cb ? args.slice(0, -1) : args)
		}).commit('emit', { actionId })
	}

	orm.on('commit:handler:finish:Action', async function (action, commit) {
		if (action && action.eventName) {
			const { value: cb } = orm.emit(`action:${commit.data.actionId}`)
			const args = jsonFn.parse(action.args)
			cms.emit(action.eventName, ...args, cb)
		}
	})

	if (orm.mode !== 'multi') {
		let onlineDevice

		orm.on('getOnlineDevice', _.once(function (_onlineDevice) {
			onlineDevice = _onlineDevice
		}))

		orm.on('commit:handler:finish:Action', async function (action, commit) {
			try {
				if (commit.data.printFromClient && onlineDevice && commit.from === onlineDevice.id) {
					await cms.emit('run:print', action)
				} else if (commit.data.printFromMaster && orm.getMaster()) {
					await cms.emit('run:print', action)
				}
			} catch (e) {
			}
		})

		// This is for client only
		orm.on('commit:auto-assign:Action', async function (commit) {
			if (!onlineDevice || !onlineDevice.id) {
				console.log('No clientId found for this device')
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
