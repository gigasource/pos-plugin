const Queue = require('better-queue');
const _ = require('lodash');
const mongoose = require('mongoose');
/*
queue: for order commit
 */
const updateCommit = {
	commitType: ['order'],
	methods: {},
	init: async function (handler) {
		updateCommit.handler = handler;
		updateCommit.orderCommitModel = cms.Types['OrderCommit'].Model;
		// updateCommit.systemCommitModel = cms.Types['SystemCommit'].Model;
		await require('./collection-commit')(updateCommit);
	},
	handleCommit: function (commits) {
		updateCommit.commitType.forEach(type => {
			const typeCommits = commits.filter(commit => {
				return commit.type === type;
			})
			updateCommit.methods[type].doTask(typeCommits);
		})
	},
	handleSyncCommit: async function (oldHighestCommitIds) {
		let result = [];
		for (let id in updateCommit.commitType) {
			const type = updateCommit.commitType[i];
			result = result.concat(await updateCommit[type].method.requireSync(oldHighestCommitIds[type]));
		}
		return result;
	},
	checkCommitExist: async function (commit) {
		return await updateCommit.methods[commit.type].checkCommitExist(commit);
	},
	setHighestCommitId: function (commits) {
		updateCommit.commitType.forEach(type => {
			const maxCommitId = Math.max.apply(null, commits.filter(commit => {
				return commit.type === type;
			}).map(commit => commit.commitId));
			updateCommit.methods[type].setHighestCommitId(maxCommitId);
		})
	},
	checkHighestCommitIds: function (id) {
		const result = {};
		updateCommit.commitType.forEach(type => {
			result[type] = updateCommit.methods[type].checkHighestCommitId(id);
		})
		return result;
	}
}

module.exports = updateCommit;
