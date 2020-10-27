const express = require('express');
const router = express.Router();
const { MongoClient } = require('mongodb');
const UpdateCommit = require('./updateCommit');
const mongoose = require('mongoose');

const connnectionUri = `mongodb://${global.APP_CONFIG.database.username}:${global.APP_CONFIG.database.password}@mongo-vn-office.gigasource.io:27017`;
let connectionHandlers = {};

async function initConnection(socket) {
	try {
		const storesList = await cms.getModel('Store').find({}).lean();
		for (let id = 0; id < storesList.length; id++) {
			const store = storesList[id];
			const client = await MongoClient.connect(connnectionUri);
			const db = client.db(store._id.toString());
			connectionHandlers[store._id.toString()] = new UpdateCommit(store._id.toString(), client, db);
			await connectionHandlers[store._id.toString()].updateCommit.init(socket);
			connectionHandlers[store._id.toString()].updateCommit.commitType.forEach(type => {
				connectionHandlers[store._id.toString()].updateCommit.getMethod(type, 'resumeQueue')();
			})
		}
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
			socket.emit('requireSync', oldHighestCommitId, buildNodeSync(connection));
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

module.exports = {
	initConnection,
	updateCommitNode,
	buildNodeSync,
	requireSyncWithMaster,
	requireSync,
	addCollection
}
