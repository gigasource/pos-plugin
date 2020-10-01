const Master = require('./master');
const Node = require('./node');
const { buildTempOrder } = require('./updateCommit');
const _ = require('lodash')

let handler;

module.exports = function (cms) {
	// init frontend socket beforehand
	this.cms.socket.on('connect', socket => {
		socket.on('buildTempOrder', async (table, fn) => {
			const order = await buildTempOrder(table);
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
	}))
	cms.post('load:masterIp', (deviceIp) => {
		console.log(`ip of this device is ${deviceIp}`)
		global.APP_CONFIG.deviceIp = deviceIp;
	})
}

async function initSocket(socket) {
	const posSettings = await cms.getModel("PosSetting").findOne({}).lean();
	const { masterClientId, onlineDevice } = posSettings;
	if (!masterClientId) {
		let retryTime = 0;
		const getMasterFromOnlineOrder = async () => {
			const { onlineDevice } = await cms.getModel("PosSetting").findOne({}).lean();
			socket.emit('getMasterIp', onlineDevice.store.alias, async (masterIp, masterClientId) => {
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

module.exports.initSocket = initSocket;
module.exports.handlerNewMasterId = handlerNewMasterId;
