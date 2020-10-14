const Queue = require('better-queue');
const _ = require('lodash');
const mongoose = require('mongoose');
/*
queue: for order commit
 */
const updateCommit = {
	commitType: ['order', 'report'],
	init: async function (handler) {
		updateCommit.handler = handler;
		updateCommit.orderCommitModel = cms.Types['OrderCommit'].Model;
		updateCommit.orderModel = cms.Types['Order'].Model;
		// updateCommit.systemCommitModel = cms.Types['SystemCommit'].Model;
		await require('./collection-commit')(updateCommit);
	},
	handleCommit: function (commits) {
		updateCommit.commitType.forEach(type => {
			const typeCommits = commits.filter(commit => {
				return commit.type === type;
			})
			if (typeCommits.length) updateCommit.getMethod(type, 'doTask')(typeCommits);
		})
	},
	checkCommitExist: async function (commit) {
		return await updateCommit.getMethod(commit.type, 'checkCommitExist')(commit);
	},
	setHighestCommitIds: function (commits) {
		updateCommit.commitType.forEach(type => {
			const maxCommitId = Math.max.apply(null, commits.filter(commit => {
				return commit.type === type;
			}).map(commit => commit.commitId));
			updateCommit.getMethod(type, 'setHighestCommitId')(maxCommitId);
		})
	},
	registerMethod: function (type, name, func) {
		if (!updateCommit[type]) updateCommit[type] = {};
		if (!updateCommit[type].methods) updateCommit[type].methods = {};
		updateCommit[type].methods[name] = func;
	},
	getMethod: function (type, name) {
		return updateCommit[type].methods && updateCommit[type].methods[name] ? updateCommit[type].methods[name] : function () {
			console.warn('Method is not defined');
		}
	}
}

module.exports = updateCommit;
