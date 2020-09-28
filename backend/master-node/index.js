const Master = require('./master');
const Node = require('./node');
const { buildTempOrder } = require('./updateCommit');

let handler;
let ip = null;

module.exports = function (cms) {
	// init frontend socket beforehand
	this.cms.socket.on('connect', socket => {
		socket.on('buildTempOrder', async (table, fn) => {
			const order = await buildTempOrder(table);
			fn(order);
		})
	});
	cms.post('load:handler', async () => {
		if (global.APP_CONFIG.isMaster) {
			handler = new Master(cms);
		} else {
			handler = new Node(cms);
		}
		await handler.init();
	})
	cms.post('load:masterIp', (masterIp) => {
		ip = masterIp;
	})
}

async function initSocket(socket) {
	const posSettings = await cms.getModel("PosSetting").findOne({}).lean();
	const { onlineDevice, masterClientId } = posSettings;
	socket.emit('getMasterIp', posSettings.onlineDevice.store.alias, async (masterIp, masterClientId) => {
		console.log(`Master ip is ${masterIp}`);
		await cms.getModel("PosSetting").findOneAndUpdate({}, { masterIp, masterClientId });
		if (!masterClientId) return;
		if (onlineDevice && onlineDevice.id && onlineDevice.id == masterClientId) {
			global.APP_CONFIG.isMaster = true;
		}
		console.debug("Is Master", global.global.APP_CONFIG.isMaster);
		cms.execPostSync('load:handler');
		await handler.initSocket(socket, masterClientId);
	})
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
module.exports.ip = ip;