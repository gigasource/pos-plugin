const Queue = require('better-queue');
const mongoose = require('mongoose');
const JsonFn = require('json-fn');
const _ = require('lodash');

async function posCommit(updateCommit) {
	const TYPENAME = 'pos';

	if (!updateCommit[TYPENAME])
		updateCommit[TYPENAME] = {};

	const commitDoc = await updateCommit.posCommitModel.findOne({}).sort('-commitId');
	updateCommit[TYPENAME].highestPosCommitId = (commitDoc && commitDoc._doc.commitId) ? commitDoc._doc.commitId + 1 : 1;
	updateCommit[TYPENAME].queue = new Queue(async (data, cb) => {
		const { commits } = data;
		const newCommits = [];
		let lastTempId;
		for (let commit of commits) {
			if (lastTempId && lastTempId != commit.groupTempId && global.APP_CONFIG.isMaster) {
				const deleteCommit = await updateCommit.getMethod(TYPENAME, 'deleteTempCommit')({ groupTempId: lastTempId});
				if (deleteCommit) newCommits.push(deleteCommit);
			}
			lastTempId = commit.groupTempId;
			const result = await updateCommit.getMethod(TYPENAME, commit.action)(commit);
			if (result) {
				if (commit.commitId) updateCommit[TYPENAME].highestPosCommitId = commit.commitId + 1;
				newCommits.push(commit);
			}
		}
		if (global.APP_CONFIG.isMaster && lastTempId) {
			const deleteCommit = await updateCommit.getMethod(TYPENAME, 'deleteTempCommit')({ groupTempId: lastTempId});
			newCommits.push(deleteCommit);
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
			const collection = mongoose.connection.db.collection(commit.data.collection);
			const query = JsonFn.parse(commit.update.query);
			if (typeof _.last(query) === 'function') {
				query.pop();
			}
			await new Promise((resolve, reject) => {
				query.push(function (err, doc) {
					if (err) reject(err);
					resolve(doc);
				})
				collection[commit.update.method].apply(collection, query);
			})
			await updateCommit.posCommitModel.create(commit);
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
}

module.exports = posCommit
