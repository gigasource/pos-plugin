const mongoose = require('mongoose');
const express = require('express');
const socketClient = require('socket.io-client');
const { p2pClientPlugin } = require('@gigasource/socket.io-p2p-plugin');
const uuid = require('uuid');
const { initQueue, pushTaskToQueue, resumeQueue, checkHighestCommitId, setHighestCommitId, buildTempOrder, updateTempCommit, checkGroupTempId } = require('./updateCommit');

class Node {
	constructor(cms) {
		this.cms = cms;
		this.onlineOrderSocket = null;
		this.socket = null;
		this.storeId = null;
		this.highestCommitId = 0;
		this.isConnect = false;
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

	async initSocket(socket) {
		const _this = this;
		await _this.getStoreId();
		const connectToMaster = (masterIp) => {
			_this.socket = socketClient.connect(`http://${masterIp}/masterNode?clientId=${socket.clientId}`);
			_this.socket.on('updateCommitNode', (commits) => {
				const oldHighestCommitId = commits.length ? checkHighestCommitId(commits[commits.length - 1].commitId) : null;
				if (!oldHighestCommitId) {
					pushTaskToQueue(commits);
					setHighestCommitId(commits[commits.length - 1].commitId + 1);
				} else {
					_this.socket.emit('requireSync', oldHighestCommitId);
				}
			})
			_this.socket.on('connect', async () => {
				_this.isConnect = true;
				const storeId = await _this.getStoreId();
				_this.socket.emit('requireSync', checkHighestCommitId());
			})
			_this.socket.on('nodeSync', async (commits) => {
				const newCommits = [];
				for (let id in commits) {
					const commit = commits[id];
					if (!(await checkGroupTempId(commit.groupTempId))) newCommits.push(commit);
				}
				if (newCommits.length) pushTaskToQueue(newCommits);
				if (newCommits && newCommits.length) setHighestCommitId(commits[commits.length - 1].commitId + 1);
			})
		}

		_this.onlineOrderSocket = p2pClientPlugin(socket, socket.clientId);
		_this.onlineOrderSocket.emit('getMasterIp', await _this.getStoreId(), async (masterIp) => {
			if (_this.socket && !_this.isConnect) {
				_this.socket.disconnect(); // safer better
				setTimeout(() => {
					connectToMaster(masterIp);
				}, 2000);
			}
			await cms.getModel("PosSetting").findOneAndUpdate({}, { masterIp });
		})

		const posSettings = await cms.getModel("PosSetting").findOne({});
		const { masterIp } = posSettings;
		if (masterIp) connectToMaster(masterIp);

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
					_this.socket.emit("updateCommits", commits); // TODO: emit to master
					await updateTempCommit(commits);
					return await buildTempOrder(table);
				}
			}
		})
		resumeQueue();
	}
}

module.exports = Node;
