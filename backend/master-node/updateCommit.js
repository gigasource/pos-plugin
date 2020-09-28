const Queue = require('better-queue');
const _ = require('lodash');

let queue;
let orderModel;
let orderCommitModel;
let highestOrderId;
let highestCommitId;
let activeOrders = {};
let nodeHighestCommitIdUpdating;

const COMMIT_TIME_OUT = 5 * 60 * 1000;
const COMMIT_CLOSE_TIME_OUT = 30 * 1000;

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
	if (table == null || !activeOrders[table]) return null;
	const commitsList = await orderCommitModel.find({table: table, temp: true}).lean();

	const result = activeOrders[table] ? _.cloneDeep(activeOrders[table]) : { items: [] };
	commitsList.forEach(commit => {
		// only accept item commit
		if (commit.type == 'item') {
			let currentItem;
			if (commit.where && commit.where.pairedObject) {
				currentItem = result['items'].find(item => item._id.toString() === commit.where.pairedObject.value[0]);
			}
			if (commit.update.push) {
				if (!commit.update.push.key.includes('modifiers')) {
					result['items'].push(commit.update.push.value);
				} else { // modifier
					if (currentItem) {
						if (currentItem.modifiers) currentItem.modifiers.push(commit.update.push.value);
						else currentItem.modifiers = [commit.update.push.value];
					}
				}
			} else if (commit.update.inc && currentItem.quantity > 0) {
				if (currentItem) {
					currentItem.quantity += commit.update.inc.value;
					if (currentItem.quantity < 0) currentItem.quantity = 0;
				}
			} else if (commit.update.pull) {
				const pullId = currentItem.modifiers.findIndex(modifier => modifier._id.toString() === commit.update.pull.value._id);
				if (pullId >= 0) currentItem.modifiers.splice(pullId, 1);
			} else if (commit.update.set) {
				if (commit.update.set.key.includes('price')) {
					currentItem.price = commit.update.set.value;
				}
				if (commit.update.set.key.includes('printed')) {
					currentItem.printed = commit.update.set.value;
				}
			}
		}
	})
	return result;
}
/*
 Case set is not actually set command of mongoose, there are 2 cases of set:
 -  Case master: master receives normal set command of mongoose, update commit and
 set value of set to order object, which is use in node case
 -  Case node: node will findOneAndUpdate order with the final value of order in
 master
*/
async function handleOrderCommit(commit) {
	let result;
	if (commit.update && commit.update.set) {
		if (commit.where && !commit.where._id) {
			commit.where._id = activeOrders[commit.table]._id;
		}
		if (commit.update.set.key === 'status') { // close order
			if (commit.timeStamp && (new Date()).getTime() - commit.timeStamp < COMMIT_CLOSE_TIME_OUT) return null; // timeout close order must be small
			if (!activeOrders[commit.table]) {
				console.error('Order has been closed');
				return null;
			}
			activeOrders[commit.table][commit.update.set.key] = commit.update.set.value;
			commit.update.set = activeOrders[commit.table];
			delete activeOrders[commit.table];
		}
		// delete all commit with this orderid and create new close commit
		if (!commit.commitId) {
			commit.commitId = highestCommitId;
			highestCommitId++;
		}
		let query;
		if (commit.update.set.key) {
			query = {};
			query[commit.update.set.key] = commit.update.set.value
		} else {
			query = commit.update.set;
		}
		await orderModel.findOneAndUpdate(commit.where, query);
		await orderCommitModel.create(commit);
		if (activeOrders[commit.table]) activeOrders[commit.table][commit.update.set.key] = commit.update.set.value;
		else await orderCommitModel.deleteMany({type: 'item', orderId: commit.orderId});
		result = true;
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
			} else highestOrderId = commit.orderId;
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
	if (!activeOrders[commit.table] || activeOrders[commit.table].id != commit.orderId) {
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
				return item._id.toString() == condition['items._id'];
			})
			if (targetItem.quantity == 0) {
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
	if (commit.update.push && !commit.update.push.key.includes('modifiers')) {
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
	let commit = null;
	if (global.APP_CONFIG.isMaster) { // Only master can create remove temp commit
		commit = {
			type: 'removeTemp',
			groupTempId,
			temp: false,
			commitId: highestCommitId++
		}
		await orderCommitModel.create(commit);
	}
	await orderCommitModel.deleteMany({groupTempId, temp: true});
	return commit;
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
	nodeHighestCommitIdUpdating = 0;
	highestCommitId = commitDoc ? commitDoc._doc.commitId + 1 : 1;
	queue = new Queue(async (data, cb) => {
		const { commits, ack } = data;
		let newCommits = [];
		let lastTempId;
		let lastTable;
		for (let id in commits) {
			// preset value
			const commit = commits[id];
			commit.temp = false;
			let result;
			if (lastTempId && lastTempId != commit.groupTempId) {
				const deleteCommit = await deleteTempCommit(lastTempId);
				newCommits.push(deleteCommit);
			}
			lastTempId = commit.groupTempId;
			// Accept commit in the last COMMIT_TIME_OUT
			if ((!commit.timeStamp || (new Date()).getTime() - commit.timeStamp <= COMMIT_TIME_OUT)) {
				if (!commit.orderId && activeOrders[commit.table]) {
					commit.orderId = activeOrders[commit.table].id;
				}
				if (commit.where && !commit.where._id && activeOrders[commit.table]) {
					commit.where._id = activeOrders[commit.table]._id;
				}
			} else continue;
			if (commit.commitId && commit.commitId < highestCommitId) continue;
			// handle commit
			if (commit.type === 'order') {
				result = await handleOrderCommit(commit);
			} else if (commit.type === 'item') { // type === 'item'
				result = await handleItemCommit(commit);
			} else if (commit.type === 'sync') { // type sync
				const commits = await handleSyncCommit(commit.oldHighestCommitId);
				if (ack) ack(commits);
			} else if (commit.type === 'removeTemp') {
				result = true;
				await deleteTempCommit(commit.groupTempId);
			}
			if (result) {
				if (commit.commitId) highestCommitId = commit.commitId + 1;
				newCommits.push(commit);
			}
			lastTable = commit.table;
		}
		// wait for db update
		if (lastTable) {
			setTimeout(() => {
				handler.cms.socket.emit('updateOrderItems');
			}, 200);
		}
		if (global.APP_CONFIG.isMaster && lastTempId) { // add a commit to delete temp commit
			const deleteCommit = await deleteTempCommit(lastTempId);
			newCommits.push(deleteCommit);
			handler.emitToAll(newCommits);
		}
		cb(null);
	})
	queue.pause();
}

function pushTaskToQueue(commits, ack) {
	queue.push({
		commits,
		ack
	});
}

function resumeQueue() {
	queue.resume();
}

/*
 nodeHighestOrderIdUpdating is for the case when node check master's
 highestCommitId and send requireSync, the next time node check with
 master's highestCommitId, the value must be updated but highestCommitId
 of node may not be updated fast enough.
 */
function checkHighestCommitId(id) {
	nodeHighestCommitIdUpdating = Math.max(nodeHighestCommitIdUpdating, highestCommitId);
	if (!id) return nodeHighestCommitIdUpdating;
	// node highest commit id must be equal to master
	return id == nodeHighestCommitIdUpdating ? null : nodeHighestCommitIdUpdating;
}

function setHighestCommitId(id) {
	nodeHighestCommitIdUpdating = id;
}

async function updateTempCommit(commits) {
	for (let i in commits) {
		await orderCommitModel.create(commits[i]);
	}
}

async function checkCommitExist(commitId) {
	return highestCommitId > commitId;
}

function getNewOrderId() {
	highestOrderId++
	return highestOrderId
}

module.exports = {
	initQueue,
	pushTaskToQueue,
	resumeQueue,
	checkHighestCommitId,
	setHighestCommitId,
	updateTempCommit,
	buildTempOrder,
	checkCommitExist,
	getNewOrderId
};
