const mongoose = require('mongoose');
const socketIO = require('socket.io');
const { p2pClientPlugin } = require('@gigasource/socket.io-p2p-plugin');
const { initQueue, pushTaskToQueue, resumeQueue, updateTempCommit, buildTempOrder, checkGroupTempId } = require('./updateCommit');
const axios = require('axios');
const internalIp = require('internal-ip');

const remoteServer = 'http://localhost:8088';

class Master {
	constructor(cms) {
		this.cms = cms;
		this.onlineOrderSocket = null;
		this.socket = null;
		this.storeId = null;
		this.highestCommitId = 0;
		this.connection = {};
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

	initSocket(socket) {
		const _this = this;
		_this.socket = _this.cms.io.of('/masterNode');
		_this.socket.on('connection', socket => {
			const clientId = socket.request._query.clientId;
			_this.connection[clientId] = socket;
			socket.on('disconnect', () => {
				delete _this.connection[clientId];
			})
			socket.on('updateCommits', async (commits) => {
				const newCommits = [];
				for (let id in commits) {
					const commit = commits[id];
					if (!(await checkGroupTempId(commit.groupTempId))) newCommits.push(commit);
				}
				if (newCommits.length) pushTaskToQueue(newCommits);
			})
			socket.on('requireSync', (oldHighestCommitId) => {
				const commit = {
					type: 'sync',
					clientId,
					oldHighestCommitId
				}
				pushTaskToQueue([commit]);
			})
		})

		// online order socket
		_this.onlineOrderSocket = p2pClientPlugin(socket, socket.clientId);
		_this.onlineOrderSocket.emit('registerMasterDevice', (`${internalIp.v4.sync()}:${global.APP_CONFIG.port}`));

		// front-end socket
		this.cms.socket.on('connect', socket => {
			socket.on('buildTempOrder', async (table, fn) => {
				const order = await buildTempOrder(table);
				fn(order);
			})
		});
	}

	async init() {
		await initQueue(this);
		const _this = this;
		const _model = cms.Types['OrderCommit'].Model;
		await _this.getStoreId();
		cms.Types['OrderCommit'].Model = new Proxy(_model, {
			get(target, key) {
				if (key != 'create') {
					return target[key];
				}
				return async function (commits) {
					const groupTempId = mongoose.Types.ObjectId().toString();
					const _storeId = await _this.getStoreId();
					let table;
					commits.forEach(commit => {
						commit.groupTempId = groupTempId;
						commit.temp = true;
						commit.storeId = _storeId;
						table = commit.table;
					})
					pushTaskToQueue(commits);
					await updateTempCommit(commits);
					return await buildTempOrder(table);
				}
			}
		})

		resumeQueue();
		mongoose.set('debug', async function (coll, method, ...query) {
			try {
				//do your thing
				// const result = await axios.post(`${remoteServer}/writeToDB`, {
				// 	coll,
				// 	method,
				// 	query,
				// 	storeId: _this.storeId
				// });
				// if (result) {
				// 	console.log(result);
				// }
			} catch (err) {
				console.error(err);
			}
		});
	}

	emitToAll(commits) {
		for (let clientId in this.connection) {
			this.connection[clientId].emit('updateCommitNode', commits);
		}
	}
}

module.exports = Master;
