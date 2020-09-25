const os = require('os');
if (os.platform() === 'android') {
	const rn_bridge = require('rn-bridge');

	module.exports = (cms) => {
		cms.post('load:afterServerListen', () => {
			// Inform react-native node is initialized.
			console.log('Sending start message');
			setTimeout(() => {
				rn_bridge.channel.send('NodeStarted');
			}, 1000);
		})
	}
} else {
	module.exports = (cms) => {
	}
}
