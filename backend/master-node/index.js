const Master = require('./master');
const Node = require('./node');

let handler;

module.exports = async function (cms) {
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
