let rn_bridge;
try {
	rn_bridge = require('rn-bridge');
} catch (err) {
	rn_bridge = require('./rn-bridge-proxy');
}

module.exports = (cms) => {
	cms.post('load:afterServerListen', () => {
		// Inform react-native node is initialized.
		setTimeout(() => {
			console.log('Sending start message');
			rn_bridge.channel.send('NodeStarted');
		}, 1000);
	})

	cms.post('run:internalSocketConnected', (socket) => {
		socket.on('screen-loaded', () => {
			rn_bridge.channel.send('ScreenLoaded');
		})
	})

	rn_bridge.channel.on('message', async (msg) => {
		const data = JSON.parse(msg);
		switch (data.type) {
			case 'ipAddress':
				console.log('Update ipAddress', data.value);
				await cms.emit('load:masterIp', [data.value]);
				break;
			case 'onResume':
				await cms.emit('run:requireSync');
				break;
			case 'mouse':
			case 'keyboard':
				console.log('app-rn-bridge:receive remote control input from RN, send to front-end')
				cms.socket.emit('remoteControlInput', msg)
				break;
			case 'installationSource':
				if (msg.value) {
					await cms.execPostAsync('run:registerAppFromStore');
				}
				break;
			case 'deviceInfo':
				global.APP_CONFIG.osName = data.deviceOS;
				global.APP_CONFIG.deviceName = data.deviceName;
				global.APP_CONFIG.buildNumber = data.buildNumber;
				if (data.hardwareID && !global.APP_CONFIG.hardwareID) {
					global.APP_CONFIG.hardwareID = data.hardwareID;
					await cms.getModel('PosSetting').findOneAndUpdate({}, {hardwareID: data.hardwareID});
				}
				cms.execPostSync('load:hardwareID', null, [global.APP_CONFIG.hardwareID]);
				break;
		}
	})
}

module.exports.sendToRN = (msg) => {
	rn_bridge.channel.send(msg);
}

