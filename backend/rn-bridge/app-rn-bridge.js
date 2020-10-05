try {
	const rn_bridge = require('rn-bridge');

	module.exports = (cms) => {
		cms.post('load:afterServerListen', () => {
			// Inform react-native node is initialized.
			setTimeout(() => {
				console.log('Sending start message');
				rn_bridge.channel.send('NodeStarted');
			}, 1000);
		})

		rn_bridge.channel.on('message', async (msg) => {
			const data = JSON.parse(msg);
			if (data.type === 'ipAddress') {
				console.log('Update ipAddress', data.value);
				await cms.execPostAsync('load:masterIp', null, [data.value]);
			} else if (data.type === 'onResume') {
				await cms.execPostAsync('run:requireSync');
			}
		})
	}

	module.exports.sendToRN = (msg) => {
		rn_bridge.channel.send(msg);
	}
} catch (err) {
	module.exports = (cms) => {}
	module.exports.sendToRN = (msg) => {}
}
