const mongoose = require('mongoose');
const express = require('express');
const socketClient = require('socket.io-client');
const { p2pClientPlugin } = require('@gigasource/socket.io-p2p-plugin');
const uuid = require('uuid');
const { initQueue, pushTaskToQueue, resumeQueue, checkHighestCommitId, setHighestCommitId, buildTempOrder, updateTempCommit } = require('./updateCommit');

class Node {
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
		_this.socket.on('updateCommitNode', (commit) => {
			const oldHighestCommitId = checkHighestCommitId(commit.commitId);
			if (!oldHighestCommitId) {
				pushTaskToQueue(commit);
				setHighestCommitId(commit.commitId + 1);
			} else {
				_this.socket.emit('requireSync', _this.storeId, oldHighestCommitId);
			}
		})
		_this.socket.on('connect', async () => {
			const storeId = await _this.getStoreId();
			_this.socket.emit('requireSync', await _this.getStoreId(), checkHighestCommitId());
		})
		_this.socket.on('nodeSync', (commits) => {
			const highestCommitId = checkHighestCommitId();
			pushTaskToQueue(commits);
			if (commits && commits.length) setHighestCommitId(commits[commits.length - 1].commitId + 1);
		})

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
					_this.socket.emit("emitToMasterDevice", commits, _storeId); // TODO: emit to master
					await updateTempCommit(commits);
					return await buildTempOrder(table);
				}
			}
		})
		resumeQueue();
	}
}

module.exports = Node;
