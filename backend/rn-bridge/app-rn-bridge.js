const os = require('os');
if (os.platform() === 'android' || os.platform() === 'ios') {
	const rn_bridge = require('rn-bridge');

	module.exports = (cms) => {
		cms.post('load:afterServerListen', () => {
			// Inform react-native node is initialized.
			setTimeout(() => {
				console.log('Sending start message');
				rn_bridge.channel.send('NodeStarted');
			}, 1000);
		})

		rn_bridge.channel.on('message', (msg) => {
			const data = JSON.parse(msg);
			if (data.type === 'ipAddress') {
				console.log('Update ipAddress', data.value);
				cms.execPostSync('load:masterIp', null, [data.value]);
			}
		})
	}

	module.exports.sendToRN = (msg) => {
		rn_bridge.channel.send(msg);
	}
} else {
	module.exports = (cms) => {}
	module.exports.sendToRN = (msg) => {}
}
