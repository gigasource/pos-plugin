const AwaitLock = require('await-lock').default;

module.exports = function (orm) {
	let masterClientId = null

	orm.setMasterClientIdCloud = function (_masterClientId) {
		masterClientId = _masterClientId
	}

	//todo: layer transport implement
	orm.on('initSyncForClientCloud', (clientSocket, dbName) => {
		const off1 = orm.onQueue('transport:toMaster', async (commit, _dbName) => {
			if (!masterClientId) return
			if (dbName !== _dbName) return
			clientSocket.emitTo(masterClientId, 'commitRequestCloud', commit)
		}).off

		clientSocket.on('transport:cloud:sync',  async () => {
			if (!masterClientId) return
			const {value: highestId} = await orm.emit('getHighestCommitId', dbName);
			orm.emit('transport:cloud:require-sync', highestId);
		})

		const off2 = orm.onQueue('transport:cloud:require-sync', (highestId) => {
			if (!masterClientId) return
			const args = [highestId];
			orm.emit('commit:sync:args', args);
			clientSocket.emitTo(masterClientId, 'transport:cloud:require-sync', args, async (commits) => {
				commits.forEach(commit => commit.dbName = dbName)
				await orm.emit('transport:requireSync:callback', commits)
			})
		}).off

		orm.on('offClient', (_dbName) => {
			if (dbName !== _dbName) return
			off1()
			off2()
			clientSocket.removeAllListeners('transport:cloud:sync');
		})
	})

	orm.on('initSyncForMasterCloud', (socket, dbName) => {
		const off1 = orm.on('master:transport:sync', (id, _dbName) => {
			if (dbName !== _dbName) return
			socket.emit('transport:cloud:sync')
		}).off;

		socket.on('commitRequestCloud', async (commit) => {
			commit.dbName = dbName
			await orm.emit('commitRequest', commit);
		});

		socket.on('transport:cloud:require-sync', async function ([clientHighestId = 0], cb) {
			const {value: commits} = await orm.emit('commit:sync:master', clientHighestId, dbName);
			cb(commits);
		});

		orm.on('offMaster', (_dbName) => {
			if (dbName !== _dbName) return
			off1()
			socket.removeAllListeners('commitRequestCloud')
			socket.removeAllListeners('transport:cloud:require-sync')
		})
	})
}
