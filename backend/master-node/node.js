const mongoose = require('mongoose');
const express = require('express');
const socketClient = require('socket.io-client');
const { p2pClientPlugin } = require('@gigasource/socket.io-p2p-plugin');
const uuid = require('uuid');
const { initQueue, pushTaskToQueue, resumeQueue, checkHighestCommitId, setHighestCommitId, buildTempOrder, updateTempCommit, checkCommitExist } = require('./updateCommit');

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
		if (!(await checkCommitExist(commit.commitId))) newCommits.push(commit);
	}
	if (newCommits.length) pushTaskToQueue(newCommits);
	if (newCommits && newCommits.length) setHighestCommitId(commits[commits.length - 1].commitId + 1);
}

const connectToMaster = async (_this, masterIp) => {
	const posSettings = await cms.getModel("PosSetting").findOne({});
	const clientId = posSettings.onlineDevice.id;
	_this.socket = socketClient.connect(`http://${masterIp}/masterNode?clientId=${clientId}`);
	_this.socket.on('updateCommitNode', (commits) => {
		const oldHighestCommitId = commits.length ? checkHighestCommitId(commits[0].commitId) : null;
		if (!oldHighestCommitId) {
			pushTaskToQueue(commits);
			setHighestCommitId(commits[commits.length - 1].commitId + 1);
		} else {
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

			this.cms.socket.on('connect', socket => {
				socket.on('buildTempOrder', async (table, fn) => {
					const order = await buildTempOrder(table);
					fn(order);
				})
			});
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
	async initSocket(socket) {
		const _this = this;
		_this.onlineOrderSocket = p2pClientPlugin(socket, socket.clientId);
		const storeId = await _this.getStoreId();
		_this.onlineOrderSocket.emit('getMasterIp', storeId, async (masterIp, masterClientId) => {
			_this.masterClientId = masterClientId;
			console.log(`Master ip is ${masterIp}`);
			if ((!_this.socket || (_this.socket && !_this.isConnect)) && masterIp) {
				if (_this.socket) _this.socket.disconnect(); // safer better
				setTimeout(() => {
					connectToMaster(_this, masterIp);
				}, 2000);
			}
			if (masterClientId) _this.onlineOrderSocket.emitTo(masterClientId, 'requireSync', checkHighestCommitId(), nodeSync);
			await cms.getModel("PosSetting").findOneAndUpdate({}, { masterIp, masterClientId });
		})
		_this.onlineOrderSocket.on('updateCommitNode', (commits) => {
			const oldHighestCommitId = commits.length ? checkHighestCommitId(commits[0].commitId) : null;
			if (!oldHighestCommitId) {
				pushTaskToQueue(commits);
				setHighestCommitId(commits[commits.length - 1].commitId + 1);
			} else {
				if (_this.masterClientId) _this.onlineOrderSocket.emitTo(masterClientId, 'requireSync', checkHighestCommitId(), nodeSync);
			}
		})
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
					})
					if (_this.socket && _this.socket.connected) {
						_this.socket.emit('updateCommits', commits);
					} else if (_this.masterClientId) {
						_this.onlineOrderSocket.emitTo(_this.masterClientId, 'updateCommits', commits);
					} else {
						throw new Error('Can not connect to master');
					}
					await updateTempCommit(commits);
					return await buildTempOrder(table);
				}
			}
		})
		resumeQueue();
	}

	turnOff() {
		if (this.onlineOrderSocket) this.onlineOrderSocket.off('updateCommitNode');
		if (this.socket) this.socket.disconnect();
	}
}

module.exports = Node;
