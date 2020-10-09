const mongoose = require('mongoose');
const Schema = mongoose.Schema;

async function syncExistingData(storeId, socket) {
	console.debug('Start syncing existing db data');
	const modelMap = mongoose.models;

	const emptySchema = new Schema({}, {strict: false});
	const collectionNames = Object.keys(modelMap);
	console.debug(`Found ${collectionNames.length} collections to sync`);

	return Promise.all(collectionNames.map(collectionName => {
		return new Promise(async (resolve, reject) => {

			const MainDbModel = modelMap[collectionName];
			const docs = await MainDbModel.find({}).lean();
			socket.emit('syncExistingDb', storeId, collectionName, docs);
		});
	})).finally(() => syncDbConnection.close());
}

module.exports = syncExistingData;
