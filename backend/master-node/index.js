const Master = require('./master');
const Node = require('./node');
const updateCommit = require('./updateCommit');
const _ = require('lodash')
const JsonFn = require('json-fn');
const mongoose = require('mongoose');

let handler;

module.exports = async function (cms) {
	// pre define cms.bridge
	if (!cms.bridge) cms.bridge = {
		emitToMaster: function () {
			console.warn('Master is not started');
		}
	}
	require('event-emitter')(cms.bridge);
	const _model = cms.Types['OrderCommit'].Model;
	cms.Types['OrderCommit'].Model = new Proxy(_model, {
		get(target, key) {
			if (key != 'addCommits') {
				return target[key];
			}
			return function () {
				console.warn('Node or Master has not started yet!');
			}
		}
	})
	// init frontend socket beforehand
	this.cms.socket.on('connect', socket => {
		socket.on('buildTempOrder', async (table, fn) => {
			const order = await updateCommit.getMethod('order', 'buildTempOrder')(table);
			fn(order);
		})
	});
	cms.post('load:handler', _.once(async () => {
		await cms.getModel('OrderCommit').deleteMany({commitId: {$exists: false}});
		if (global.APP_CONFIG.isMaster) {
			handler = new Master(cms);
		} else {
			handler = new Node(cms);
		}
		await handler.init();
		const posSettings = await cms.getModel("PosSetting").findOne({}).lean();
		if (posSettings.hardwareID) {
			global.APP_CONFIG.hardwareID = posSettings.hardwareID;
		}
	}))
	cms.post('load:masterIp', (deviceIp) => {
		console.log(`ip of this device is ${deviceIp}`)
		global.APP_CONFIG.deviceIp = deviceIp;
	})
	cms.socket.on('connect', async (socket) => {
		await cms.execPostAsync('run:internalSocketConnected', null, [socket])
	})
}

async function setUpPosCommit() {
	console.log('Setup pos commit');
	const posCommitCollectionExists = (await cms.getModel('PosCommit').findOne({}).lean()) ? 1 : 0;
	const needCreatePosCommitCollection = [];
	let commitId = 0;
	cms.orm.post('debug', null, async ({target, proxy}, returnResult) => {
		if (needCreatePosCommitCollection.includes(target.collectionName) && target.cmd === 'insertMany') {
			commitId++;
			await cms.getModel('PosCommit').create({
				type: 'pos',
				action: 'update',
				temp: false,
				data: {
					collection: coll
				},
				commitId,
				update: {
					method: method,
					query: JsonFn.stringify(query)
				}
			})
			returnResult.ok = 1;
			returnResult.value = null;
			return;
		}
		const collection = mongoose.connection.db.collection(coll);
		return collection[method].apply(collection, query);

	})
	/*mongoose.set('debug', function (coll, method, ...query) {
		if (needCreatePosCommitCollection.includes(coll) && method === 'insertMany') {
			commitId++;
			cms.getModel('PosCommit').create({
				type: 'pos',
				action: 'update',
				temp: false,
				data: {
					collection: coll
				},
				commitId,
				update: {
					method: method,
					query: JsonFn.stringify(query)
				}
			}).then(() => {
				if (typeof _.last(query) === 'function') {
					_.last(query)(null, {n: 1, ok: true});
				}
			})
			return;
		}
		const collection = mongoose.connection.db.collection(coll);
		return collection[method].apply(collection, query);
	})*/
	if (!posCommitCollectionExists) {
		for (let coll of global.APP_CONFIG.whiteListCollection) {
			if (coll.mongooseName && cms.getModel(coll.mongooseName).find) {
				const collExists = (await cms.getModel(coll.mongooseName).find({}).lean());
				if (collExists) {
					needCreatePosCommitCollection.push(coll.name);
					await cms.getModel(coll.mongooseName).insertMany(collExists);
				}
			}
		}
	}
	cms.orm._posts.get('debug').length = 0;
	//mongoose.set('debug', null);
}

async function initSocket(socket) {
	const posSettings = await cms.getModel("PosSetting").findOne({}).lean();
	const { masterClientId, onlineDevice } = posSettings;
	cms.socket.emit('getMasterDevice', masterClientId);
	if (masterClientId && onlineDevice && onlineDevice.id && onlineDevice.id == masterClientId) {
		global.APP_CONFIG.isMaster = true;
	}
	await cms.execPostAsync('load:handler');
	await handler.initSocket(socket, masterClientId);
}

/*
	Because master is set only once so this
	function always change state from node
	to master
 */
async function handleNewMasterId(socket) {
	await initSocket(socket);
}

module.exports.initSocket = _.once(initSocket);
module.exports.handleNewMasterId = handleNewMasterId;
