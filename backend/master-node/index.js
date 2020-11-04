const Master = require('./master');
const Node = require('./node');
const updateCommit = require('./updateCommit');
const _ = require('lodash')
// const mongoose = require('mongoose');

let handler;

module.exports = function (cms) {
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
	// console.debug(getBaseSentryTags('initHandler'), '1. Set handler');
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
		// console.debug(getBaseSentryTags('initHandler'), '5. handler.init()');
		await handler.init();
		// console.debug(getBaseSentryTags('initHandler'), '6. Finish handler');
		const posSettings = await cms.getModel("PosSetting").findOne({}).lean();
		if (posSettings.hardwareID) {
			global.APP_CONFIG.hardwareID = posSettings.hardwareID;
		}
	}))
	cms.post('load:masterIp', (deviceIp) => {
		console.log(`ip of this device is ${deviceIp}`)
		global.APP_CONFIG.deviceIp = deviceIp;
	})
}

async function initSocket(socket) {
	// console.debug(getBaseSentryTags('initHandler'), '2. Set socket');
	const posSettings = await cms.getModel("PosSetting").findOne({}).lean();
	const { masterClientId, onlineDevice } = posSettings;
	if (!masterClientId) {
		// console.debug(getBaseSentryTags('initHandler'), '3. There is no masterClientId');
		let retryTime = 0;
		const getMasterFromOnlineOrder = async () => {
			const { onlineDevice } = await cms.getModel("PosSetting").findOne({}).lean();
			socket.emit('getMasterIp', onlineDevice.store.alias, async (masterIp, masterClientId) => {
				cms.socket.emit('getMasterDevice', masterClientId);
				console.log(`Master ip is ${masterIp}`);
				await cms.getModel("PosSetting").findOneAndUpdate({}, {masterIp, masterClientId});
				if (!masterClientId) {
					if (retryTime < 5) setTimeout(async () => {
						await getMasterFromOnlineOrder();
					}, 5000)
					retryTime += 1;
					return;
				}
				if (onlineDevice && onlineDevice.id && onlineDevice.id == masterClientId) {
					global.APP_CONFIG.isMaster = true;
				}
				await cms.execPostAsync('load:handler');
				await handler.initSocket(socket, masterClientId);
			})
		}
		setTimeout(async () => {
			await getMasterFromOnlineOrder();
		}, 3000);
	} else {
		cms.socket.emit('getMasterDevice', masterClientId);
		// console.debug(getBaseSentryTags('initHandler'), '4. Already had masterClientId');
		if (onlineDevice && onlineDevice.id && onlineDevice.id == masterClientId) {
			global.APP_CONFIG.isMaster = true;
		}
		await cms.execPostAsync('load:handler');
		await handler.initSocket(socket, masterClientId);
	}
}

/*
	Because master is set only once so this
	function always change state from node
	to master
 */
async function handlerNewMasterId(socket) {
	await initSocket(socket);
}

// function getBaseSentryTags(eventType, clientId) {
// 	const appVersion = require('../../package').version;
// 	const {deviceName} = global.APP_CONFIG;
//
// 	let tag = `sentry:version=${appVersion},deviceName=${deviceName},eventType=${eventType}`;
// 	if (clientId) tag += `,clientId=${clientId}`;
//
// 	return tag;
// }

module.exports.initSocket = initSocket;
module.exports.handlerNewMasterId = handlerNewMasterId;
// module.exports.getBaseSentryTags = getBaseSentryTags;
