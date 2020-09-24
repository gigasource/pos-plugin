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

module.exports.initSocket = function (socket) {
	handler.initSocket(socket);
}

async function startMaster(socket) {
	handler.turnOff();
	handler = new Master(handler.cms);
	await handler.initSocket(socket)
}

async function startNode(socket) {
	handler.turnOff();
	handler = new Node(handler.cms);
	await handler.initSocket(socket);
}

async function connectToOtherMaster(socket) {
	handler.turnOff();
	await handler.initSocket(socket);
}

module.exports.handlerNewMasterId = async function (newMasterClientId, socket) {
	const { masterClientId, onlineDevice } = await cms.getModel("PosSetting").findOneAndUpdate({}, { masterClientId: newMasterClientId }).lean();
	if (onlineDevice.id !== newMasterClientId && masterClientId === onlineDevice.id) { // case master -> node
		await startNode(socket);
	} else if (onlineDevice.id === newMasterClientId) { // case node -> master
		await startMaster(socket);
	} else {
		await connectToOtherMaster(socket);
	}
}
