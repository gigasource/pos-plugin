const Queue = require('better-queue');
const _ = require('lodash');
const mongoose = require('mongoose');
const JsonFn = require('json-fn');

const updateMethodList = ['update', 'findOneAndUpdate', 'findOneAndModify', 'insertOne', 'create', 'insertMany', 'remove', 'deleteMany', 'insert', 'updateOne'];

const updateCommit = {
	commitType: ['order', 'report', 'pos'],
	init: async function (handler) {
		updateCommit.handler = handler;
		updateCommit.orderCommitModel = cms.Types['OrderCommit'].Model;
		updateCommit.posCommitModel = cms.Types['PosCommit'].Model;
		updateCommit.orderModel = cms.Types['Order'].Model;
		// updateCommit.systemCommitModel = cms.Types['SystemCommit'].Model;
		await require('./collection-commit')(updateCommit);
		mongoose.set('debug', function (coll, method, ...query) {
			if (updateMethodList.includes(method))  {
				const whiteListCollection = _.filter(global.APP_CONFIG.whiteListCollection, collection => {
					return collection.name === coll;
				})
				if (whiteListCollection.length) {
					updateCommit.handler.sendChangeRequest({
						type: 'pos',
						action: 'update',
						temp: false,
						groupTempId: mongoose.Types.ObjectId().toString(),
						data: {
							collection: coll,
							hardwareID: (whiteListCollection[0].needMaster ? null : global.APP_CONFIG.hardwareID)
						},
						update: {
							method: method,
							query: JsonFn.stringify(query)
						}
					})
					// check collection need to be executed on master
					if (whiteListCollection[0].needMaster) {
						if (typeof _.last(query) === 'function') {
							_.last(query)(null, {n: 1, ok: true});
						}
						return;
					}
				}
			}
			try {
				const collection = mongoose.connection.db.collection(coll);
				return collection[method].apply(collection, query);
			} catch (err) {
				console.error(err);
			}
		})
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
