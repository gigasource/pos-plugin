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

function proxyBuilder(collectionName, db) {
	const convertKey = (key) => {
		if (key === 'create') return 'insertOne';
		return null;
	}

	const convertChainToMongoQuery = (chain) => {
		// case findOne and sort in mongoose
		if (chain >= 2 && chain[0].fn === 'findOne' && chain[1].fn === 'sort') {
			chain[0].fn = 'find';
			// check sort argument
			if (typeof chain[1].args[0] === 'string') {
				chain[1].args[0] = chain[1].args[0].includes('-') ? {[chain[1].args[0].slice(1)] : -1} : {[chain[1].args[0]]: 1};
			}
			chain.push({
				fn: 'limit',
				args: 1
			})
			return;
		}
	}

	const doChainQuery = async (chain) => {
		try {
			if (err) {
				console.error(err);
			}
			let result = db.collection(collectionName);
			const mainMethod = chain[0].fn;
			for (const {fn, args} of chain) {
				 result = await result[fn](...args);
			}
			const resultToArray = result.toArray ? await result.toArray() : result;
			return new Proxy(result, {
				get(target, key) {
					switch (key) {
						case '_doc':
							return _.cloneDeep(result);
							break;
						case 'lean':
							if (['findOne'].includes(mainMethod)) {
								return result;
							}
							if (['findOneAndUpdate', 'find'].includes(mainMethod)) {
								return resultToArray;
							}
							break;
						case 'toJSON':
							if (mainMethod === 'create') {
								return result.ops[0]; // this is the operation which is executed
							}
							return result;
							break;
					}
					return target[key];
				}
			})
		} catch (err) {
			console.error(err);
		}
	}

	return new Proxy({collName: collectionName, chain: []}, {
		get(target, key) {
			if (['modelName'].includes(key)) {
				return target[key];
			}

			key = convertKey(key);
			if (key === 'then') {
				return function (resolve, reject) {
					convertChainToMongoQuery(target.chain);
					doChainQuery(target.chain);
				}
			}
			return function () {
				target.chain.push({fn: key, args: [...arguments]});
				return this;
			}
			// handle key
			// return function () {
			// 	return new Proxy({}, {
			// 		get(target, key) {
			// 			return function (query, options) {
			// 				if (key === 'then') {
			// 					return function (resolve, reject) {
			//
			// 					}
			// 				}
			// 			}
			// 		}
			// 	})
			// }
		}
	})
}

module.exports = {
	convertResultToObject,
	convertToObjectId,
	convertMongooseQueryToMongoQuery,
	proxyBuilder
}
