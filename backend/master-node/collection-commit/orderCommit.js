const Queue = require('better-queue');
const JsonFn = require('json-fn');
const _ = require('lodash');
const mongoose = require('mongoose');

const COMMIT_TIME_OUT = 5 * 60 * 1000;
const COMMIT_CLOSE_TIME_OUT = 30 * 1000;

async function orderCommit(updateCommit) {
	/* -------------- Method for this file only -------------- */
	function validateCommit(commit) {
		if ((!commit.timeStamp || (new Date()).getTime() - commit.timeStamp <= COMMIT_TIME_OUT)) {
			if (commit.data && commit.data.table) {
				if (!commit.data.orderId && updateCommit['order'].activeOrders[commit.data.table]) {
					commit.data.orderId = updateCommit['order'].activeOrders[commit.data.table].id;
				}
				if (commit.where && !commit.where._id && updateCommit['order'].activeOrders[commit.data.table]) {
					commit.where._id = updateCommit['order'].activeOrders[commit.data.table]._id;
				}
			}
		} else return false;
		if (commit.commitId && commit.commitId < updateCommit['order'].highestOrderCommitId) return false;
		return true;
	}

	function validateOrderId(commit) {
		if (commit.data.orderId && updateCommit['order'].activeOrders[commit.data.table] &&
			commit.data.orderId != updateCommit['order'].activeOrders[commit.data.table].id) {
			console.error('This commit is for old order');
			return false;
		}
		return true;
	}

	function checkOrderActive(commit) {
		if (!updateCommit['order'].activeOrders[commit.data.table] || updateCommit['order'].activeOrders[commit.data.table].id != commit.data.orderId) {
			console.error("Order is closed or not created");
			return false;
		}
		return true;
	}

	function getCondition(commit) {
		const condition = commit.where ? JsonFn.parse(commit.where) : null;
		if (condition && !condition._id) {
			condition._id = updateCommit['order'].activeOrders[commit.data.table]._id;
			commit.where = JsonFn.stringify(condition);
		}
		return condition;
	}
	/* ----- */


	const activeOrdersList = await updateCommit.orderModel.find({status: 'inProgress', online: false}).lean();
	if (!updateCommit['order']) updateCommit['order'] = {};
	updateCommit['order'].activeOrders = {};
	activeOrdersList.forEach(activeOrder => {
		updateCommit['order'].activeOrders[activeOrder.table] = activeOrder;
	});
	const orderDoc = await updateCommit.orderModel.findOne({}).sort('-id');
	updateCommit['order'].highestOrderId = (orderDoc && orderDoc._doc.id) ? orderDoc._doc.id + 1 : 1;
	const commitDoc = await updateCommit.orderCommitModel.findOne({}).sort('-commitId');
	updateCommit['order'].highestOrderCommitId = (commitDoc && commitDoc._doc.commitId) ? commitDoc._doc.commitId + 1 : 1;
	updateCommit['order'].nodeHighestOrderCommitIdUpdating = 0;

	updateCommit['order'].queue = new Queue(async (data, cb) => {
		const { commits } = data;
		// console.debug(getBaseSentryTags('updateCommitQueue'), 'List commit', JSON.stringify(commits));
		let newCommits = [];
		let lastTempId;
		let lastTable;
		for (let id in commits) {
			// preset value
			const commit = commits[id];
			commit.temp = false;
			if (lastTempId && lastTempId != commit.groupTempId && global.APP_CONFIG.isMaster) {
				const deleteCommit = await updateCommit.getMethod('order', 'deleteTempCommit')({ groupTempId: lastTempId});
				if (deleteCommit) newCommits.push(deleteCommit);
			}
			lastTempId = commit.groupTempId;
			// Accept commit in the last COMMIT_TIME_OUT
			if (!validateCommit(commit)) continue;
			const result = await updateCommit.getMethod('order', commit.action)(commit);
			if (result) {
				if (commit.commitId) updateCommit['order'].highestOrderCommitId = commit.commitId + 1;
				newCommits.push(commit);
			}
			if (commit.data && commit.data.table) lastTable = commit.data.table;
		}
		// console.debug(getBaseSentryTags('updateCommitQueue'), 'After exec commits', JSON.stringify(activeOrders));
		// wait for db update
		setTimeout(() => {
			updateCommit.handler.cms.socket.emit('updateOrderItems');
			updateCommit.handler.cms.socket.emit('update-table-status');
		}, 200);
		if (global.APP_CONFIG.isMaster && lastTempId) { // add a commit to delete temp commit
			const deleteCommit = await updateCommit.getMethod('order', 'deleteTempCommit')({ groupTempId: lastTempId});
			newCommits.push(deleteCommit);
			updateCommit.handler.emitToAll(newCommits);
		}
		cb(null);
	})
	updateCommit['order'].queue.pause();

	/* -------------- UpdateCommit Method -------------- */
	/*
	Delete temporary commit for order
	 */
	updateCommit.registerMethod('order', 'deleteTempCommit', async function ({ groupTempId }) {
		let commit = null;
		await updateCommit.orderCommitModel.deleteMany({ groupTempId, temp: true });
		commit = {
			type: 'order',
			action: 'deleteTempCommit',
			groupTempId,
			temp: false,
			commitId: updateCommit['order'].highestOrderCommitId++
		}
		await updateCommit.orderCommitModel.create(commit);
		return commit;
	})

	updateCommit.registerMethod('order', 'pushTaskToQueue', function (commits, ack) {
		updateCommit['order'].queue.push({
			commits,
			ack
		});
	})

	updateCommit.registerMethod('order', 'resumeQueue', function () {
		updateCommit['order'].queue.resume();
	})

	/*
  nodeHighestOrderIdUpdating is for the case when node check master's
  highestOrderCommitId and send requireSync, the next time node check with
  master's highestOrderCommitId, the value must be updated but highestOrderCommitId
  of node may not be updated fast enough.
  */
	updateCommit.registerMethod('order', 'checkHighestCommitId', function (id) {
		updateCommit['order'].nodeHighestOrderCommitIdUpdating =
			Math.max(updateCommit['order'].nodeHighestOrderCommitIdUpdating, updateCommit['order'].highestOrderCommitId);
		if (!id) return updateCommit['order'].nodeHighestOrderCommitIdUpdating;
		// node highest commit id must be equal to master
		return id == updateCommit['order'].nodeHighestOrderCommitIdUpdating ? null : updateCommit['order'].nodeHighestOrderCommitIdUpdating;
	})

	updateCommit.registerMethod('order', 'setHighestCommitId', function (id) {
		updateCommit['order'].nodeHighestOrderCommitIdUpdating = id;
	})

	updateCommit.registerMethod('order', 'createOrder', async function (commit) {
		try {
			// Verify id for commit and order
			if (!validateOrderId(commit)) return;
			if (!commit.commitId) {
				commit.commitId = updateCommit['order'].highestOrderCommitId;
				updateCommit['order'].highestOrderCommitId++;
			}
			if (!commit.data.orderId) {
				commit.data.orderId = updateCommit['order'].highestOrderId;
				updateCommit['order'].highestOrderId++;
			} else updateCommit['order'].highestOrderId = commit.data.orderId;
			// get query
			const query = JsonFn.parse(commit.update.query);
			query.id = commit.data.orderId;
			let result;
			if (query.splitId) {
				result = await updateCommit.orderModel[commit.update.method](query);
				await updateCommit.orderCommitModel.create(commit);
			} else {
				if (updateCommit['order'].activeOrders[commit.data.table]) {
					console.error('Order has been created');
					return null;
				} else {
					query.date = new Date();
					query.online = false;
					result = await updateCommit.orderModel[commit.update.method](query);
					if (!result) return null;
					query._id = result._doc._id;
					updateCommit['order'].activeOrders[commit.data.table] = (await updateCommit.orderModel.findOne({id: commit.data.orderId})).toJSON();
					commit.update.query = JSON.stringify(query);
					await updateCommit.orderCommitModel.create(commit);
				}
			}
			return result;
		} catch (err) {
			console.error('Error occurred', err);
			return null;
		}
	})

	updateCommit.registerMethod('order', 'closeOrder', async function (commit) {
		try {
			// Verify id for commit and order
			if (!validateOrderId(commit)) return;
			const condition = getCondition(commit);
			if (commit.timeStamp && (new Date()).getTime() - commit.timeStamp > COMMIT_CLOSE_TIME_OUT) return null;
			if (!updateCommit['order'].activeOrders[commit.data.table]) {
				console.error('Order has been closed');
				return null;
			}
			delete updateCommit['order'].activeOrders[commit.data.table];
			if (!commit.commitId) {
				commit.commitId = updateCommit['order'].highestOrderCommitId;
				updateCommit['order'].highestOrderCommitId++;
			}
			const query = JsonFn.parse(commit.update.query);
			await updateCommit.orderModel[commit.update.method](condition, query);
			await updateCommit.orderCommitModel.create(commit);
			await updateCommit.orderCommitModel.deleteMany({ temp: true, table: commit.data.table })
			return true;
		} catch (err) {
			console.error('Error occurred', err);
			return null;
		}
	})

	updateCommit.registerMethod('order', 'setOrderProps', async function (commit) {
		try {
			// Verify id for commit and order
			if (!validateOrderId(commit)) return;
			const condition = getCondition(commit);
			const query = JsonFn.parse(commit.update.query);
			if (query['$set'] && query['$set']['status'] && query['$set']['status'] === 'paid') {
				return await updateCommit.getMethod('order', 'closeOrder')(commit);
			}
			updateCommit['order'].activeOrders[commit.data.table] = await updateCommit.orderModel[commit.update.method](condition, query, { new : true }).lean();
			commit.where = JsonFn.stringify(condition);
			await updateCommit.orderCommitModel.create(commit);
			return true;
		} catch (err) {
			console.error('Error occurred', err);
			return null;
		}
	})

	updateCommit.registerMethod('order', 'addItem', async function (commit) {
		try {
			if (!checkOrderActive(commit)) return;
			const query = JsonFn.parse(commit.update.query);
			const condition = getCondition(commit);
			const result = await updateCommit.orderModel[commit.update.method](condition, query, { new : true });
			updateCommit['order'].activeOrders[commit.data.table] = result.toJSON();
			if (!commit.commitId) {
				commit.commitId = updateCommit['order'].highestOrderCommitId;
				updateCommit['order'].highestOrderCommitId++;
			}
			query['$push']['items']._id = result._doc['items'][result._doc['items'].length - 1]._doc._id;
			commit.update.query = JsonFn.stringify(query);
			await updateCommit.orderCommitModel.create(commit);
			return true;
		} catch (err) {
			console.error('Error occurred', err);
			return null;
		}
	})

	updateCommit.registerMethod('order', 'changeItemQuantity', async function (commit) {
		try {
			if (!checkOrderActive(commit)) return;
			const query = JsonFn.parse(commit.update.query);
			const condition = getCondition(commit);
			if (query['$inc'] && query['$inc']['items.$.quantity'] < 0) {
				const targetItem = updateCommit['order'].activeOrders[commit.data.table].items.find(item => {
					return item._id.toString() === condition['items._id'];
				})
				if (targetItem.quantity + query['$inc']['items.$.quantity'] < 0) {
					console.error('Can not reduce quantity to neg');
					return;
				}
				if (targetItem.printed) {
					if (!updateCommit['order'].activeOrders[commit.data.table].cancellationItems) updateCommit['order'].activeOrders[commit.data.table].cancellationItems = [];
					updateCommit['order'].activeOrders[commit.data.table].cancellationItems.push({
						...targetItem,
						date: new Date(),
						quantity: -query['$inc']['items.$.quantity']
					})
					await updateCommit.orderModel[key]({ _id: updateCommit['order'].activeOrders[commit.data.table]._id },
						{ $set: { cancellationItems: updateCommit['order'].activeOrders[commit.data.table].cancellationItems } });
				}
			}
			const result = await updateCommit.orderModel[commit.update.method](condition, query, { new : true });
			updateCommit['order'].activeOrders[commit.data.table] = result.toJSON();
			if (!commit.commitId) {
				commit.commitId = updateCommit['order'].highestOrderCommitId;
				updateCommit['order'].highestOrderCommitId++;
			}
			await updateCommit.orderCommitModel.create(commit);
			return true;
		} catch (err) {
			console.error('Error occurred', err);
			return null;
		}
	})

	updateCommit.registerMethod('order', 'update', async function (commit) {
		try {
			if (!checkOrderActive(commit)) return;
			const query = JsonFn.parse(commit.update.query);
			const condition = getCondition(commit);
			const result = await updateCommit.orderModel[commit.update.method](condition, query, { new : true });
			updateCommit['order'].activeOrders[commit.data.table] = result.toJSON();
			if (!commit.commitId) {
				commit.commitId = updateCommit['order'].highestOrderCommitId;
				updateCommit['order'].highestOrderCommitId++;
			}
			await updateCommit.orderCommitModel.create(commit);
			return true;
		} catch (err) {
			console.error('Error occurred', err);
			return null;
		}
	})

	updateCommit.registerMethod('order', 'changeTable', async function (commit) {
		try {
			const result = await updateCommit.orderCommitModel.updateMany({orderId: commit.data.orderId}, {table: commit.update}, {new: true});
			if (!result) return;
			updateCommit['order'].activeOrders[commit.update] = updateCommit['order'].activeOrders[commit.data.table];
			const condition = JsonFn.parse(commit.where);
			await updateCommit.orderModel.findOneAndUpdate(condition, {$set: {table: commit.update}})
			delete updateCommit['order'].activeOrders[commit.data.table];
			if (!commit.commitId) {
				commit.commitId = updateCommit['order'].highestOrderCommitId;
				updateCommit['order'].highestOrderCommitId++;
			}
			await updateCommit.orderCommitModel.create(commit);
			return result;
		} catch (err) {
			console.error('Error occurred', err);
			return null;
		}
	})

	updateCommit.registerMethod('order', 'requireSync', async function ({ oldHighestCommitId, ack }) {
		try {
			const syncCommits = await updateCommit.orderCommitModel.find({commitId: {$gt: oldHighestCommitId - 1}});
			ack(syncCommits);
			return false;
		} catch (err) {
			console.error('Error occurred', err);
			return null;
		}
	})

	updateCommit.registerMethod('order', 'updateTempCommit', async function (commits) {
		try {
			for (let i in commits) {
				await updateCommit.orderCommitModel.create(commits[i]);
			}
		} catch (err) {
			console.error('Error occurred', err);
			return null;
		}
	})

	updateCommit.registerMethod('order', 'checkCommitExist', async function ({ commitId }) {
		return updateCommit['order'].highestOrderCommitId > commitId;
	})

	updateCommit.registerMethod('order', 'getNewOrderId', async function () {
		updateCommit['order'].highestOrderId++
		return updateCommit['order'].highestOrderId - 1
	})

	updateCommit.registerMethod('order', 'doTask', function (commits, ack) {
		updateCommit['order'].queue.push({
			commits,
			ack
		});
	})

	/*
	temporary order is build by using temporary commits, apply mongoose
	query for them and return the final result
	 */
	updateCommit.registerMethod('order', 'buildTempOrder', async function (table) {
		let _id = new mongoose.Types.ObjectId();
		try {
			if (table == null) return null;
			const commitsList = await updateCommit.orderCommitModel.find({'data.table': table, temp: true}).lean();
			const tempCommit = updateCommit['order'].activeOrders[table] ? _.cloneDeep(updateCommit['order'].activeOrders[table]) : {items: []};
			tempCommit._id = _id;
			await updateCommit.orderModel.create(tempCommit);
			const promiseList = [];
			commitsList.forEach(commit => {
				if (commit.action !== 'createOrder') {
					const query = (commit.update.query ? JsonFn.parse(commit.update.query) : null);
					const condition = (commit.where ? JsonFn.parse(commit.where) : null);
					if (condition && condition._id) condition._id = _id;
					promiseList.push(updateCommit.orderModel[commit.update.method](condition, query));
				}
			})
			await Promise.all(promiseList);
			const result = await updateCommit.orderModel.findOne({ _id }).lean();
			delete result._id;
			if (updateCommit['order'].activeOrders[table]) result._id = updateCommit['order'].activeOrders[table]._id;
			await updateCommit.orderModel.deleteMany({ _id });
			return result;
		} catch (err) {
			await updateCommit.orderModel.deleteMany({ _id });
			console.error('Error occurred', err);
			return null;
		}
	})

	updateCommit.registerMethod('order', 'printOrder', async function (commit) {
		try {
			if (commit.order._id) {
				const order = await cms.getModel('Order').findById(commit.order._id)
				if (order) commit.order.id = order.toJSON().id
			}
			await cms.execPostAsync('run:print', null, [commit]);
		} catch (err) {
			console.error('Error occurred', err);
			return null;
		}
	})
}

module.exports = orderCommit;
