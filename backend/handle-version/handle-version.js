const uuid = require('uuid');

module.exports = async (cms) => {
	let { installUUID } = await cms.getModel('PosSetting').findOne({}).lean();
	if (!installUUID) {
		installUUID = uuid.v4();
		await cms.getModel('PosSetting').findOneAndUpdate({}, {$set: { installUUID }})
	}
	if (global.APP_CONFIG.hardwareID) {
		global.APP_CONFIG.appUUID = `${global.APP_CONFIG.hardwareID}:${installUUID}`;
	}
	cms.on('load:hardwareId', (hardwareID) => {
		global.APP_CONFIG.appUUID = `${hardwareID}:${installUUID}`;
	})
}
