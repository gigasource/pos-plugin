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
		if (!(await updateCommit.checkCommitExist(commit.commitId))) newCommits.push(commit);
	}
	if (newCommits.length) updateCommit.handleCommit(newCommits);
	updateCommit.setHighestCommitId(newCommits);
	if (newCommits && newCommits.length) updateCommit.setHighestCommitId(commits[commits.length - 1].commitId + 1);
}

const connectToMaster = async (_this, masterIp) => {
	const posSettings = await cms.getModel("PosSetting").findOne({});
	const clientId = posSettings.onlineDevice.id;
	_this.socket = socketClient.connect(`http://${masterIp}/masterNode?clientId=${clientId}`);
	_this.socket.on('updateCommitNode', (commits) => {
		console.debug('nodeReceiveCommit', 'Receive commit from master', JSON.stringify(commits));
		const oldHighestCommitId = commits.length ? checkHighestCommitId(commits[0].commitId) : null;
		if (!oldHighestCommitId) {
			updateCommit.handleCommit(commits);
			updateCommit.setHighestCommitId(commits);
		} else {
			console.debug('nodeReceiveCommit', 'Need sync');
			_this.socket.emit('requireSync', oldHighestCommitId, nodeSync);
		}
	})
	_this.socket.on('connect', async () => {
		console.log('Node connected to master');
		_this.isConnect = true;
		// wait for initQueue finish
		setTimeout(() => {
			_this.socket.emit('requireSync', checkHighestCommitId(), nodeSync);
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
		setTimeout(async () => {
			const posSettings = await cms.getModel("PosSetting").findOne({});
			const { masterIp, masterClientId } = posSettings;
			this.masterClientId = masterClientId;
			if (masterIp) await connectToMaster(this, masterIp);
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
		const _this = this;
		_this.masterClientId = masterClientId;
		_this.onlineOrderSocket = p2pClientPlugin(socket, socket.clientId);
		const storeId = await _this.getStoreId();
		_this.onlineOrderSocket.on('updateCommitNode', (commits) => {
			const oldHighestCommitId = commits.length ? checkHighestCommitId(commits[0].commitId) : null;
			if (!oldHighestCommitId) {
				updateCommit.handleCommit(commits);
				updateCommit.setHighestCommitId(commits);
			} else {
				if (_this.masterClientId) _this.onlineOrderSocket.emitTo(_this.masterClientId, 'requireSync', updateCommit.checkHighestCommitIds(), nodeSync);
			}
		})
		if (_this.masterClientId) _this.onlineOrderSocket.emitTo(_this.masterClientId, 'requireSync', updateCommit.checkHighestCommitIds(), nodeSync);
	}

	async init() {
		await updateCommit.init(this);
		const _this = this;

		_this.cms.post('run:requireSync', () => {
			if (_this.socket.connected) {
				_this.socket.emit('requireSync', updateCommit.checkHighestCommitIds(), nodeSync);
			} else if (_this.masterClientId) {
				_this.onlineOrderSocket.emitTo(_this.masterClientId, 'requireSync', updateCommit.checkHighestCommitIds(), nodeSync);
			}
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
						table = commit.table;
						if (commit.split && commit.update.create) {
							commit.update.create._id = mongoose.Types.ObjectId();
						}
					})
					if (_this.socket && _this.socket.connected) {
						_this.socket.emit('updateCommits', commits);
					} else if (_this.masterClientId) {
						_this.onlineOrderSocket.emitTo(_this.masterClientId, 'updateCommits', commits);
					} else {
						throw new Error('Can not connect to master');
					}
					await updateCommit.methods['order'].updateTempCommit(commits);
					if (commits.length && commits[0].split) {
						return commits[0].update.create;
					}
					return await updateCommit.methods['order'].buildTempOrder(table);
				}
			}
		})
		resumeQueue();
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
			this.onlineOrderSocket.emitTo(this.masterClientId, 'updateCommits', [commit]);
		}
	}
}

module.exports = Node;
