const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const UpdateCommit = require('./updateCommit');
const mongoose = require('mongoose');
const orm = require('schemahandler/orm');
const connnectionUri = `mongodb://${global.APP_CONFIG.database.username}:${global.APP_CONFIG.database.password}@mongo-vn-office.gigasource.io:27017`;
const _ = require('lodash');

orm.connect(connnectionUri);
let connectionHandlers = {};
let externalSocketIOServer;

async function initConnection(socket) {
	try {
		if (!orm.connected || orm.closed || orm.connecting) {
			await orm.waitForConnected();
		}
		externalSocketIOServer = socket;
		cms.post('run:triggerOnlineAsMaster', (storeId) => {
			if (typeof storeId !== 'string') {
				storeId = storeId.toString();
			}
			connectionHandlers[storeId].updateCommit.isMaster = true;
		})
		const storesList = await cms.getModel('Store').find({}).lean();
		for (let id = 0; id < storesList.length; id++) {
			const store = storesList[id];
			connectionHandlers[store._id.toString()] = new UpdateCommit(store._id.toString(), orm.cache.get('client'));
			await connectionHandlers[store._id.toString()].updateCommit.init(socket);
			connectionHandlers[store._id.toString()].updateCommit.commitType.forEach(type => {
				connectionHandlers[store._id.toString()].updateCommit.getMethod(type, 'resumeQueue')();
			})
			const devices = await cms.getModel('Device').find({ _id: store._id }).lean();
			const masterDevice = _.find(devices, device => device.master);
			if (!masterDevice) {
				await cms.execPostAsync('run:triggerOnlineAsMaster', null, [store._id]);
			}
		}
		console.log('init db for each store completed');
	} catch (err) {
		console.error('init connection to master and node error', err)
	}
}

function buildNodeSync(connection) {
	if (connection instanceof mongoose.Types.ObjectId) { // is storeId
		connection = connectionHandlers[connection.toString()];
	}
	return async function (commits) {
		const newCommits = [];
		for (let id in commits) {
			const commit = commits[id];
			if (!(await connection.updateCommit.checkCommitExist(commit))) newCommits.push(commit);
		}
		if (newCommits.length) connection.updateCommit.handleCommit(newCommits);
		if (newCommits && newCommits.length) connection.updateCommit.setHighestCommitIds(commits);
	}
}

function requireSyncWithMaster(storeId, socket) {
	const updateCommit = connectionHandlers[storeId].updateCommit;
	return updateCommit.commitType.forEach(type => {
		socket.emit('requireSync', type, updateCommit.getMethod(type, 'checkHighestCommitId'), buildNodeSync(storeId));
	});
}

async function updateCommitNode(storeId, commits, socket) {
	const connection = connectionHandlers[storeId];
	connection.updateCommit.commitType.forEach(type => {
		const typeCommits = commits.filter(commit => commit.type === type);
		if (!typeCommits.length) return;
		const oldHighestCommitId = connection.updateCommit.getMethod(type, 'checkHighestCommitId')(typeCommits[0].commitId);
		if (!oldHighestCommitId) {
			connection.updateCommit.handleCommit(typeCommits);
			connection.updateCommit.setHighestCommitIds(typeCommits);
		} else {
			socket.emit('requireSync', type, oldHighestCommitId, buildNodeSync(connection));
		}
	})
	// const oldHighestCommitId = commits.length ? connection.checkHighestCommitId(commits[0].commitId) : null;
	// if (!oldHighestCommitId) {
	// 	connection.updateCommit.handleCommit(commits);
	// 	connection.updateCommit.setHighestCommitIds(commits);
	// } else {
	// 	socket.emit('requireSync', connection.checkHighestCommitId(), buildNodeSync(connection));
	// }
}

function requireSync(storeId, type, oldHighestCommitId, ack) {
	const commit = {
		type,
		action: 'requireSync',
		oldHighestCommitId,
		ack
	}
	connectionHandlers[storeId].updateCommit.handleCommit([commit]);
}

function addCollection(storeId, collectionName, docs) {
	connectionHandlers[storeId].updateCommit.db.collection(collectionName).insertMany(docs);
}

async function updateCommits(storeId, commits, ack) {
	if (ack) {
		ack(true);
	}
	if (typeof storeId !== 'string') {
		storeId = storeId.toString();
	}
	const connection = connectionHandlers[storeId];
	const newCommits = [];
	for (let id in commits) {
		const commit = commits[id];
		if (!(await connection.updateCommit.checkCommitExist(commit))) newCommits.push(commit);
	}
	if (newCommits.length) connection.updateCommit.handleCommit(newCommits);
}

async function dbExists(storeId) {
	return await connectionHandlers[storeId].updateCommit.db.collection('poscommits').count() ||
		await connectionHandlers[storeId].updateCommit.db.collection('ordercommits').count();
}

async function createStoreBackUpDb(storeId) {
	if (connectionHandlers[storeId]) return;
	connectionHandlers[storeId] = new UpdateCommit(storeId, orm.cache.get('client'));
	await connectionHandlers[storeId].updateCommit.init(externalSocketIOServer);
	connectionHandlers[storeId].updateCommit.commitType.forEach(type => {
		connectionHandlers[storeId].updateCommit.getMethod(type, 'resumeQueue')();
	})
	await cms.execPostAsync('run:triggerOnlineAsMaster', null, [storeId]);
}

module.exports = {
	initConnection,
	updateCommitNode,
	buildNodeSync,
	requireSyncWithMaster,
	requireSync,
	addCollection,
	updateCommits,
	dbExists,
	createStoreBackUpDb
}
