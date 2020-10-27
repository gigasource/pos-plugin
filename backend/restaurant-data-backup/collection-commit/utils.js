function convertMongooseQueryToMongoQuery(update) {
	if (update.method === 'create') {
		update.method = 'insertOne';
	}
	return update;
}

async function convertResultToObject(method, result) {
	if (!result) return null;
	if (method === 'find') {
		return await result.toArray();
	} else if (method === 'findOne') {
		return result;
	} else if (method === 'findOneAndUpdate') {
		return result.value;
	}
	if (result.hasNext) return await result.hasNext() ? await result.next() : null;
	if (result.value) return result.value;
	return result;
}

function convertToObjectId(id) {
	return mongoose.Types.ObjectId(id);
}

module.exports = {
	convertResultToObject,
	convertToObjectId,
	convertMongooseQueryToMongoQuery
}
