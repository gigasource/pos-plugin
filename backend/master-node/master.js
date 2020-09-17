const mongoose = require('mongoose');
const socketIO = require('socket.io');
const { p2pClientPlugin } = require('@gigasource/socket.io-p2p-plugin');
const { initQueue, pushTaskToQueue, resumeQueue, updateTempCommit, buildTempOrder } = require('./updateCommit');
const axios = require('axios');

const remoteServer = 'http://localhost:8088';

class Master {
	constructor(cms) {
		this.cms = cms;
		this.socket = null;
		this.storeId = null;
		this.highestCommitId = 0;
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
		_this.socket = p2pClientPlugin(socket, socket.clientId);
		_this.socket.on('updateCommitMaster', (commits) => {
			pushTaskToQueue(commits);
		});
		_this.socket.on('syncCommit', (clientId, oldHighestCommitId) => {
			const commit = {
				type: 'sync',
				clientId,
				oldHighestCommitId
			}
			pushTaskToQueue([commit]);
		})
		_this.socket.emit('registerMasterDevice');

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
}

module.exports = Master;
