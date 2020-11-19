const Queue = require('better-queue');
const JsonFn = require('json-fn');
const _ = require('lodash');
const orm = require('schemahandler');

async function posCommit(updateCommit) {
	const TYPENAME = 'pos';

	function emitToFrontend(commit) {
		if (updateCommit.isOnlineOrder) return;
		if (commit.data.collection === 'Product') {
			cms.socket.emit('updateProductProps');
		} else if (commit.data.collection === 'Room') {
			cms.socket.emit('updateRooms');
		} else if (commit.data.collection === 'OrderLayout') {
			cms.socket.emit('updateOrderLayouts');
		}
	}

	if (!updateCommit[TYPENAME])
		updateCommit[TYPENAME] = {};

	const commitDoc = await updateCommit.posCommitModel.findOne({}).sort('-commitId').lean();
	updateCommit[TYPENAME].highestPosCommitId = (commitDoc && commitDoc.commitId) ? commitDoc.commitId + 1 : 1;
	updateCommit[TYPENAME].nodeHighestPosCommitIdUpdating = 0;
	updateCommit[TYPENAME].queue = new Queue(async (data, cb) => {
		const { commits } = data;
		const newCommits = [];
		let lastTempId;
		for (let commit of commits) {
			lastTempId = commit.groupTempId;
			if (commit.commitId && commit.commitId < updateCommit[TYPENAME].highestPosCommitId) continue;
			let result;
			if (updateCommit.isOnlineOrder || !(commit.data && commit.data.appUUID === global.APP_CONFIG.appUUID)) {
				result = await updateCommit.getMethod(TYPENAME, commit.action)(commit);
			} else result = true;

			if (result) {
				if (commit.commitId) {
					updateCommit[TYPENAME].highestPosCommitId = commit.commitId + 1;
				} else {
					commit.commitId = updateCommit[TYPENAME].highestPosCommitId;
					updateCommit[TYPENAME].highestPosCommitId++;
				}
				await updateCommit.posCommitModel.create(commit);
				newCommits.push(commit);
			}
		}
		if (updateCommit.isMaster && lastTempId && newCommits.length) {
			updateCommit.handler.emitToAll(newCommits);
		}
		cb(null);
	})
	updateCommit[TYPENAME].queue.pause();

	updateCommit.registerMethod(TYPENAME, 'resumeQueue', function () {
		updateCommit[TYPENAME].queue.resume();
	})

	updateCommit.registerMethod(TYPENAME, 'doTask', function (commits) {
		updateCommit[TYPENAME].queue.push({
			commits
		})
	})

	updateCommit.registerMethod(TYPENAME, 'update', async function (commit) {
		try {
			const collection = updateCommit.db.collection(commit.data.collection);
			const query = JsonFn.parse(commit.update.query, true, true);
			if (updateCommit.isOnlineOrder) {
				query.name = `${query.name}@${updateCommit.storeId}`;
			}
			await orm.execChain(query);
			if (!commit.commitId) {
				commit.commitId = updateCommit[TYPENAME].highestPosCommitId;
				updateCommit[TYPENAME].highestPosCommitId++;
			}
			emitToFrontend(commit);
			return true;
		} catch (err) {
			console.error('Error occurred', err);
		}
	})

	updateCommit.registerMethod(TYPENAME, 'requireSync', async function ({ oldHighestCommitId, ack }) {
		try {
			const syncCommits = await updateCommit.posCommitModel.find({commitId: {$gt: oldHighestCommitId - 1}});
			ack(syncCommits);
			return false;
		} catch (err) {
			console.error('Error occurred', err);
			return null;
		}
	})

	updateCommit.registerMethod(TYPENAME, 'checkCommitExist', async function ({ commitId }) {
		return updateCommit[TYPENAME].highestPosCommitId > commitId;
	})

	updateCommit.registerMethod(TYPENAME, 'setHighestCommitId', function (id) {
		updateCommit[TYPENAME].nodeHighestPosCommitIdUpdating = id;
	})

	updateCommit.registerMethod(TYPENAME, 'checkHighestCommitId', function (id) {
		updateCommit[TYPENAME].nodeHighestPosCommitIdUpdating =
			Math.max(updateCommit[TYPENAME].nodeHighestPosCommitIdUpdating, updateCommit[TYPENAME].highestPosCommitId);
		if (!id) return updateCommit[TYPENAME].nodeHighestPosCommitIdUpdating;
		// node highest commit id must be equal to master
		return id <= updateCommit[TYPENAME].nodeHighestPosCommitIdUpdating ? null : updateCommit[TYPENAME].nodeHighestPosCommitIdUpdating;
	})
}

module.exports = posCommit
