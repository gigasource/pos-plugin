const mongoose = require('mongoose');
const express = require('express');
const socketClient = require('socket.io-client');
const { p2pClientPlugin } = require('@gigasource/socket.io-p2p-plugin');
const uuid = require('uuid');
const updateCommit = require('./updateCommit');

const nodeSync = async function (commits) {
	/*
	Online order will return null if master's
	socket is disconnect
	 */
	if (!commits) {
		throw new Error('Can not connect to master');
	}
	const newCommits = [];
	for (let id in commits) {
		const commit = commits[id];
		if (!(await updateCommit.checkCommitExist(commit))) newCommits.push(commit);
	}
	if (newCommits.length) updateCommit.handleCommit(newCommits);
	updateCommit.setHighestCommitIds(newCommits);
}

const connectToMaster = async (_this, masterIp) => {
	if (_this.socket && _this.socket.connected) {
		_this.socket.disconnect();
	}
	const posSettings = await cms.getModel("PosSetting").findOne({});
	const clientId = posSettings.onlineDevice.id;
	_this.socket = socketClient.connect(`http://${masterIp}/masterNode?clientId=${clientId}`);
	_this.socket.on('updateCommitNode', (commits) => {
		updateCommit.commitType.forEach(type => {
			const typeCommits = commits.filter(commit => commit.type === type);
			if (!typeCommits.length) return;
			const oldHighestCommitId = updateCommit.getMethod(type, 'checkHighestCommitId')(typeCommits[0].commitId);
			if (!oldHighestCommitId) {
				updateCommit.handleCommit(typeCommits);
				updateCommit.setHighestCommitIds(typeCommits);
			} else {
				console.debug('nodeReceiveCommit', 'Need sync');
				_this.socket.emit('requireSync', type, oldHighestCommitId, nodeSync);
			}
		})
	})
	_this.socket.on('connect', async () => {
		console.log('Node connected to master');
		_this.isConnect = true;
		// wait for initQueue finish
		setTimeout(() => {
			updateCommit.commitType.forEach(type => {
				_this.socket.emit('requireSync', type, updateCommit.getMethod(type, 'checkHighestCommitId')(), nodeSync);
			})
		}, 200)
	})
}

class Node {
	constructor(cms) {
		console.log('Starting node');
		this.cms = cms;
		this.onlineOrderSocket = null;
		this.socket = null;
		this.storeId = null;
		this.highestCommitId = 0;
		this.isConnect = false;
		this.masterClientId = null;
		cms.post('load:masterClientId', async () => {
			const posSettings = await cms.getModel("PosSetting").findOne({});
			const { masterIp, masterClientId } = posSettings;
			this.masterClientId = masterClientId;
			if (masterIp) await connectToMaster(this, masterIp);
		})
		setTimeout(async () => {
			await cms.execPostAsync('load:masterClientId');
		}, 0)
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
	async initSocket(socket, masterClientId) {
		const posSettings = await cms.getModel("PosSetting").findOne({}).lean();
		const { onlineDevice } = posSettings;
		const _this = this;
		_this.masterClientId = masterClientId;
		_this.onlineOrderSocket = p2pClientPlugin(socket, socket.clientId);
		const storeId = await _this.getStoreId();
		_this.onlineOrderSocket.on('updateCommitNode', (commits) => {
			updateCommit.commitType.forEach(type => {
				const typeCommits = commits.filter(commit => commit.type === type);
				if (!typeCommits.length) return;
				const oldHighestCommitId = updateCommit.getMethod(type, 'checkHighestCommitId')(typeCommits[0].commitId);
				if (!oldHighestCommitId) {
					updateCommit.handleCommit(typeCommits);
					updateCommit.setHighestCommitIds(typeCommits);
				} else {
					console.debug('nodeReceiveCommit', 'Need sync');
					_this.onlineOrderSocket.emit('requireSync', _this.masterClientId, type, oldHighestCommitId, nodeSync);
				}
			})
		})
		_this.onlineOrderSocket.emit('getMasterIp', onlineDevice.store.alias, async (masterIp, masterClientId) => {
			if (masterIp != posSettings.masterIp) {
				await connectToMaster(_this, masterIp);
				await cms.getModel("PosSetting").findOneAndUpdate({}, {masterIp, masterClientId});
			}
		})
		if (_this.masterClientId) {
			updateCommit.commitType.forEach(type => {
				_this.onlineOrderSocket.emit('requireSync', _this.masterClientId, type,
					updateCommit.getMethod(type, 'checkHighestCommitId')(), nodeSync);
			})
		}
	}

	async init() {
		await updateCommit.init(this);
		const _this = this;

		_this.cms.post('run:requireSync', () => {
			updateCommit.commitType.forEach(type => {
				if (_this.socket.connected) {
					_this.socket.emit('requireSync', type, updateCommit.getMethod(type, 'checkHighestCommitId')(), nodeSync);
				} else if (_this.masterClientId) {
					_this.onlineOrderSocket.emit('requireSync', _this.masterClientId, type,
						updateCommit.getMethod(type, 'checkHighestCommitId')(), nodeSync);
				}
			})
		})

		const _model = cms.Types['OrderCommit'].Model;
		cms.Types['OrderCommit'].Model = new Proxy(_model, {
			get(target, key) {
				if (key != 'create') {
					return target[key];
				}
				return async function (commits) {
					const timeStamp = (new Date()).getTime();
					const groupTempId = mongoose.Types.ObjectId().toString();
					const _storeId = await _this.getStoreId();
					let table;
					commits.forEach(commit => {
						commit.groupTempId = groupTempId;
						commit.temp = true;
						commit.storeId = _storeId;
						commit.timeStamp = timeStamp;
						table = commit.data.table;
					})
					if (_this.socket && _this.socket.connected) {
						_this.socket.emit('updateCommits', commits);
					} else if (_this.masterClientId) {
						_this.onlineOrderSocket.emit('updateCommits', _this.masterClientId, commits);
					} else {
						throw new Error('Can not connect to master');
					}
					await updateCommit.getMethod('order', updateTempCommit(commits));
					if (commits.length && commits[0].data && commits[0].data.split) {
						return commits[0].update.create;
					}
					return await updateCommit.getMethod('order', 'buildTempOrder')(table);
				}
			}
		})
		updateCommit.getMethod('order', 'resumeQueue')();
		updateCommit.getMethod('report', 'resumeQueue')();
		updateCommit.getMethod('pos', 'resumeQueue')();
	}

	turnOff() {
		if (this.onlineOrderSocket) this.onlineOrderSocket.off('updateCommitNode');
		if (this.socket) this.socket.disconnect();
	}

	async sendChangeRequest(commit) {
		commit.storeId = await this.getStoreId();
		if (!this.onlineOrderSocket.connected || !this.socket.connected) {
			return console.error('Socket is not connected');
		}
		if (this.socket.connected) {
			this.socket.emit('updateCommits', [commit]);
		} else {
			this.onlineOrderSocket.emit('updateCommits', this.masterClientId, [commit]);
		}
	}
}

module.exports = Node;
