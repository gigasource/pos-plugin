const Master = require('./master');
const Node = require('./node');

let handler;

module.exports = async function (cms) {
	const posSettings = await cms.getModel("PosSetting").findOne({}).lean();
	const { onlineDevice, masterClientId } = posSettings;
	if (onlineDevice && onlineDevice.id && onlineDevice.id == masterClientId) {
		global.APP_CONFIG.isMaster = true;
	}
	if (global.APP_CONFIG.isMaster) {
		handler = new Master(cms);
	} else {
		handler = new Node(cms);
	}
	await handler.init();
}

module.exports.initSocket = async function (socket) {
	await handler.initSocket(socket);
}

async function startMaster(socket) {
	handler.turnOff();
	handler = new Master(handler.cms);
	await handler.initSocket(socket)
}

/*
	Because master is set only once so this
	function always change state from node
	to master
 */
module.exports.handlerNewMasterId = async (socket) => {
	await startMaster(socket);
}
