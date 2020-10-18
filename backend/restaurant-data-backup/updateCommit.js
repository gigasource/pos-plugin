const Queue = require('better-queue');
const _ = require('lodash');

class UpdateCommit {
	constructor(storeId, client, db) {
		const _this = this;
		_this.updateCommit = {
			isMaster: false,
			storeId,
			client,
			db,
			orderCommitModel: db.collection('ordercommits'),
			orderModel: db.collection('orders'),
			commitType: ['order', 'report', 'pos'],
			methods: {},
			handler: {},
			init: async function (socket) {
				await require('./collection-commit')(_this.updateCommit);
				_this.updateCommit.handler.emitToAll = async function (commits) {
					const devices = await cms.getModel('Device').find({ storeId: _this.updateCommit.storeId, paired: true });
					devices.forEach((device) => {
						socket.emitTo(device._id.toString(), 'updateCommitNode', commits)
					});
				};
			},
			handleCommit: function (commits) {
				_this.updateCommit.commitType.forEach(type => {
					const typeCommits = commits.filter(commit => {
						return commit.type === type;
					})
					if (typeCommits.length) _this.updateCommit.getMethod(type, 'doTask')(typeCommits);
				})
			},
			checkCommitExist: async function (commit) {
				return await _this.updateCommit.getMethod(commit.type, 'checkCommitExist')(commit);
			},
			setHighestCommitIds: function (commits) {
				_this.updateCommit.commitType.forEach(type => {
					const maxCommitId = Math.max.apply(null, commits.filter(commit => {
						return commit.type === type;
					}).map(commit => commit.commitId));
					_this.updateCommit.getMethod(type, 'setHighestCommitId')(maxCommitId);
				})
			},
			registerMethod: function (type, name, func) {
				if (!_this.updateCommit[type]) _this.updateCommit[type] = {};
				if (!_this.updateCommit[type].methods) _this.updateCommit[type].methods = {};
				_this.updateCommit[type].methods[name] = func;
			},
			getMethod: function (type, name) {
				if (!_this.updateCommit[type]) _this.updateCommit[type] = {};
				return _this.updateCommit[type].methods && _this.updateCommit[type].methods[name] ? _this.updateCommit[type].methods[name] : function () {
					console.warn(`Method ${name} is not defined`);
				}
			}
		}
	}

	setMaster() {
		this.updateCommit.isMaster = true;
	}
}

module.exports = UpdateCommit;
