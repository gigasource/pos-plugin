const mongoose = require('mongoose');
const socketIO = require('socket.io');
const { p2pClientPlugin } = require('@gigasource/socket.io-p2p-plugin');
const updateCommit  = require('./updateCommit');
const axios = require('axios');
const internalIp = require('internal-ip');
const syncExistingData = require('./syncData');

const remoteServer = 'http://localhost:8088';

const updateCommits = async (commits) => {
	const newCommits = [];
	for (let id in commits) {
		const commit = commits[id];
		if (!(await checkCommitExist(commit.commitId))) newCommits.push(commit);
	}
	if (newCommits.length) pushTaskToQueue(newCommits);
}

const requireSync = (oldHighestCommitId, ack) => {
	const commit = {
		type: 'sync',
		oldHighestCommitId
	}
	pushTaskToQueue([commit], ack);
}

class Master {
	constructor(cms) {
		console.log('Starting master');
		this.cms = cms;
		this.onlineOrderSocket = null;
		this.socket = null;
		this.storeId = null;
		this.highestCommitId = 0;
		this.connection = {};

		// p2p socket
		cms.post('load:masterSocket', () => {
			const _this = this;

			_this.socket = _this.cms.io.of('/masterNode');
			_this.socket.on('connection', socket => {
				const clientId = socket.request._query.clientId;
				_this.connection[clientId] = socket;
				socket.on('disconnect', () => {
					delete _this.connection[clientId];
				})
				socket.on('updateCommits', updateCommits);
				socket.on('requireSync', requireSync);
			})
		})
	}

	async getStoreId() {
		const _this = this;
		if (!_this.storeId) {
			const posSettings = await cms.getModel("PosSetting").findOne({});
			const { onlineDevice } = posSettings;
			if (onlineDevice && onlineDevice.store) {
				_this.storeId = onlineDevice.store.alias;
			}
		}
		return _this.storeId;
	}
	// init online order socket
	async initSocket(socket) {
		// online order socket
		const _this = this;
	  _this.onlineOrderSocket = p2pClientPlugin(socket, socket.clientId);
		_this.onlineOrderSocket.emit('registerMasterDevice', (`${internalIp.v4.sync() ? internalIp.v4.sync() : global.APP_CONFIG.deviceIp}:${global.APP_CONFIG.port}`));
		_this.onlineOrderSocket.on('updateCommits', updateCommits);
		_this.onlineOrderSocket.on('requireSync', requireSync);
		await cms.execPostAsync('load:syncDb');
	}

	async init() {
		await updateCommit.init(this);
		/*
		Load master must be called after initQueue finish
		because socket event might be triggered before
		queue is initialized
		 */
		this.cms.execPostSync('load:masterSocket');
		const _this = this;
		const _model = cms.Types['OrderCommit'].Model;
		await _this.getStoreId();
		cms.Types['OrderCommit'].Model = new Proxy(_model, {
			get(target, key) {
				if (key != 'create') {
					return target[key];
				}
				return async function (commits) {
					try {
						const groupTempId = mongoose.Types.ObjectId().toString();
						const _storeId = await _this.getStoreId();
						let table;
						commits.forEach(commit => {
							commit.groupTempId = groupTempId;
							commit.temp = true;
							commit.storeId = _storeId;
							table = commit.table;
							if (commit.split && commit.update.create) {
								commit.update.create._id = mongoose.Types.ObjectId();
							}
						})
						updateCommit.handleCommit(commits);
						await updateCommit.methods['order'].updateTempCommit(commits);
						if (commits.length && commits[0].split) {
							return commits[0].update.create;
						}
						return await updateCommit.methods['order'].buildTempOrder(table);
					} catch (err) {
					}
				}
			}
		})

		updateCommit.methods['order'].resumeQueue();
	}

	emitToAll(commits) {
		this.onlineOrderSocket.emit('emitToAllDevices', commits, this.storeId);
		for (let clientId in this.connection) {
			this.connection[clientId].emit('updateCommitNode', commits);
		}
	}

	turnOff() {
		this.onlineOrderSocket.off('updateCommits');
		this.onlineOrderSocket.off('requireSync');
		for (let clientId in this.connection) {
			this.connection[clientId].disconnect();
		}
	}

	async sendChangeRequest(commit) {
		commit.storeId = await this.getStoreId();
		updateCommit.handleCommit([commit]);
	}

	async syncDataToOnlineOrder() {
		await syncExistingData();
	}
}

module.exports = Master;
