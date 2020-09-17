const Queue = require('better-queue');
const _ = require('lodash');

let queue;
let orderModel;
let orderCommitModel;
let highestOrderId;
let highestCommitId;
let activeOrders = {};

const COMMIT_TIME_OUT = 5 * 60 * 1000;

function deserializeObj(obj) {
	const result = {};
	if (!obj) return;
	if (obj.key && obj.value) {
		result[obj.key] = obj.value;
		return result;
	}
	Object.keys(obj).forEach(key => {
		if (key === 'pairedObject') {
			const pairedKeysList = obj[key].key;
			const pairedValueList = obj[key].value;
			pairedKeysList.forEach((pairedKey, id) => {
				result[pairedKey] = pairedValueList[id];
			})
		} else {
			result[key] = obj[key];
		}
	})
	return result;
}

async function buildTempOrder(table) {
	if (table == null) return null;
	const commitsList = await orderCommitModel.find({table: table, temp: true});

	const result = activeOrders[table] ? _.clone(activeOrders[table]) : { items: [] };
	commitsList.forEach(commit => {
		// only accept item commit
		if (commit.type == 'item') {
			let currentItem;
			if (commit.where.pairedObject) {
				currentItem = result['items'].find(item => item === commit.where.pairedObject.value[0]);
			}
			if (commit.update.push) {
				if (commit.update.push.key.include('items')) {
					result['items'].push(commit.update.push.value);
				} else { // modifier
					if (currentItem) currentItem.modifier.push(commit.update.push.value);
				}
			} else if (commit.update.inc && currentItem.quantity > 0) {
				if (currentItem) currentItem.quantity--;
			} else if (commit.update.pull) {
				// TODO add pull here
			}
		}
	})
	return result;
}

async function handleOrderCommit(commit) {
	let result;
	if (commit.update['close']) {  // close order
		if (activeOrders[commit.table]) {
			// delete all commit with this orderid and create new close commit
			delete activeOrders[commit.table];
			if (!commit.commitId) {
				commit.commitId = highestCommitId;
				highestCommitId++;
			}
			await orderCommitModel.create(commit);
			await orderCommitModel.deleteMany({orderId: commit.orderId, commitId: {$ne: highestCommitId}});
			result = true;
			//TODO: consider when closed add commit
		} else {
			console.error('Order has been closed');
			return null;
		}
	} else {  // open order
		if (activeOrders[commit.table]) {
			console.error('Order has been created');
			return null;
		} else {
			if (!commit.commitId) {
				commit.commitId = highestCommitId;
				highestCommitId++;
			}
			if (!commit.orderId) {
				commit.orderId = highestOrderId;
				highestOrderId++;
			}
			const key = 'create';
			commit.update[key].id = commit.orderId;
			commit.update[key].date = new Date();
			commit.update[key].online = false;
			result = await orderModel[key](commit.update[key]);
			activeOrders[commit.table] = (await orderModel.findOne({id: commit.orderId})).toJSON();
			commit.update[key] = result._doc;
			await orderCommitModel.create(commit);
		}
	}
	return result;
}

async function handleItemCommit(commit) {
	if (!commit.orderId && activeOrders[commit.table] && (!commit.timeStamp || (new Date()).getTime() - commit.timeStamp <= COMMIT_TIME_OUT)) {
		commit.orderId = activeOrders[commit.table].id;
	}
	if (!activeOrders[commit.table]) {
		console.error("Order is closed or not created");
		return null;
	}
	// findOneAndUpdate
	let result;
	const key = 'findOneAndUpdate';
	const query = {};
	Object.keys(commit.update).forEach(key => {
		query[`$${key}`] = {};
		query[`$${key}`][commit.update[key].key] = commit.update[key].value;
	});
	const condition = deserializeObj(commit.where);
	if (query['$inc']) { // check case -1 always >= 0
		let checker = false;
		Object.keys(query['$inc']).forEach(key => {
			checker |= (query['$inc'][key] == -1);
		})
		if (checker) {
			const targetItem = activeOrders[commit.table].items.find(item => {
				return item._doc._id.toString() == condition['items._id'];
			})
			if (targetItem._doc.quantity == 0) {
				console.error('Can not reduce quantity to neg');
				return null;
			}
		}
	}
	result = await orderModel[key](condition, query, {new: true});
	activeOrders[commit.table] = result.toJSON();
	if (!commit.commitId) {
		commit.commitId = highestCommitId;
		highestCommitId++;
	}
	// set _id for new added item
	if (commit.update.push) {
		const pushKey = commit.update.push.key;
		commit.update.push['value']._id = result._doc[pushKey][result._doc[pushKey].length - 1]._doc._id;
	}
	await orderCommitModel.create(commit);

	return result;
}

async function handleSyncCommit(oldHighestCommitId) {
	return await orderCommitModel.find({commitId: {$gt: oldHighestCommitId - 1}});
}

async function deleteTempCommit(groupTempId) {
	await orderCommitModel.deleteMany({groupTempId, temp: true});
}

async function initQueue(handler) {
	orderModel = handler.cms.Types['Order'].Model;
	orderCommitModel = handler.cms.Types['OrderCommit'].Model;
	let activeOrdersList = await orderModel.find({status: 'inProgress', online: false}).lean();
	activeOrdersList.forEach(activeOrder => {
		activeOrders[activeOrder.table] = activeOrder;
	})
	const orderDoc = await orderModel.findOne({}).sort('-id');
	highestOrderId = orderDoc ? orderDoc._doc.id + 1 : 1;
	const commitDoc = await orderCommitModel.findOne({}).sort('-commitId');
	highestCommitId = commitDoc ? commitDoc._doc.commitId + 1 : 1;
	queue = new Queue(async (data, cb) => {
		const { commits } = data;
		let newCommits = [];
		let groupTempId;
		for (let id in commits) {
			const commit = commits[id];
			commit.temp = false;
			let result;
			groupTempId = commit.groupTempId;
			if (commit.type === 'order') {
				result = await handleOrderCommit(commit);
			} else if (commit.type === 'item') { // type === 'item'
				result = await handleItemCommit(commit);
			} else if (commit.type === 'sync') { // type sync
				const commits = await handleSyncCommit(commit.oldHighestCommitId);
				handler.socket.emitTo(commit.clientId, 'nodeSync', commits);
			} else if (commit.type === 'removeTemp') {
				await deleteTempCommit(commit.groupTempId);
			}
			if (result) {
				newCommits.push(commit);
			}
		}
		if (global.APP_CONFIG.isMaster) {
			const commit = {
				type: 'removeTemp',
				groupTempId,
				temp: false
			}
			newCommits.push(commit);
			await orderCommitModel.create(commit);
			await deleteTempCommit(groupTempId);
			handler.socket.emit('emitToAllDevices', newCommits, handler.storeId);
		}
		cb(null);
	})
	queue.pause();
}

function pushTaskToQueue(commits) {
	queue.push({
		commits
	});
}

function resumeQueue() {
	queue.resume();
}

function checkHighestCommitId(id) {
	if (!id) return highestCommitId;
	// node highest commit id must be equal to master
	return id == highestCommitId ? null : highestCommitId;
}

function setHighestCommitId(id) {
	highestCommitId = id;
}

async function updateTempCommit(commits) {
	for (let i in commits) {
		await orderCommitModel.create(commits[i]);
	}
}

module.exports = {
	initQueue,
	pushTaskToQueue,
	resumeQueue,
	checkHighestCommitId,
	setHighestCommitId,
	updateTempCommit,
	buildTempOrder
};
