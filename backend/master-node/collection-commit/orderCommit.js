const Queue = require('better-queue');
const JsonFn = require('json-fn');
const _ = require('lodash');
const mongoose = require('mongoose');

const COMMIT_TIME_OUT = 5 * 60 * 1000;
const COMMIT_CLOSE_TIME_OUT = 30 * 1000;

async function orderCommit(updateCommit) {
  const TYPENAME = 'order';

  /* -------------- Method for this file only -------------- */
  function validateCommit(commit) {
    if ((!commit.timeStamp || (new Date()).getTime() - commit.timeStamp <= COMMIT_TIME_OUT)) {
      if (commit.data && commit.data.table) {
        if (!commit.data.orderId && updateCommit[TYPENAME].activeOrders[commit.data.table]) {
          commit.data.orderId = updateCommit[TYPENAME].activeOrders[commit.data.table]._id.toString();
        }
        if (commit.where && !commit.where._id && updateCommit[TYPENAME].activeOrders[commit.data.table]) {
          commit.where._id = updateCommit[TYPENAME].activeOrders[commit.data.table]._id;
        }
      }
    } else return false;
    if (commit.commitId && commit.commitId < updateCommit[TYPENAME].highestOrderCommitId) return false;
    return true;
  }

  function validateOrderId(commit) {
    if (commit.data && commit.data.orderId && updateCommit[TYPENAME].activeOrders[commit.data.table] &&
      commit.data.orderId != updateCommit[TYPENAME].activeOrders[commit.data.table]._id.toString()) {
      console.error('This commit is for old order');
      return false;
    }
    return true;
  }

  function checkOrderActive(commit) {
    if (commit.data.allowMutateInactiveOrder) return true;
    if (!updateCommit[TYPENAME].activeOrders[commit.data.table]
      || updateCommit[TYPENAME].activeOrders[commit.data.table]._id.toString() != commit.data.orderId) {
      console.error("Order is closed or not created");
      return false;
    }
    return true;
  }

  function getCondition(commit) {
    const condition = commit.where ? JsonFn.parse(commit.where) : null;
    if (condition && !condition._id && updateCommit[TYPENAME].activeOrders[commit.data.table]) {
      condition._id = updateCommit[TYPENAME].activeOrders[commit.data.table]._id;
      commit.where = JsonFn.stringify(condition);
    }
    return condition;
  }

  function setCommitId(commit) {
    if (!commit.commitId) {
      commit.commitId = updateCommit[TYPENAME].highestOrderCommitId;
      updateCommit[TYPENAME].highestOrderCommitId++;
    }
  }

  /* ----- */


  const activeOrdersList = await updateCommit.orderModel.find({status: 'inProgress', online: false}).lean();
  if (!updateCommit[TYPENAME]) updateCommit[TYPENAME] = {};
  updateCommit[TYPENAME].activeOrders = {};
  activeOrdersList.forEach(activeOrder => {
    updateCommit[TYPENAME].activeOrders[activeOrder.table] = activeOrder;
  });

  cms.post('resetHighestOrderId', async () => {
    const orderDoc = await updateCommit.orderModel.findOne({}).sort('-id');
    updateCommit[TYPENAME].highestOrderId = (orderDoc && orderDoc._doc.id) ? orderDoc._doc.id + 1 : 1;
  })

  await cms.execPostAsync('resetHighestOrderId', null, []);

  const commitDoc = await updateCommit.orderCommitModel.findOne({}).sort('-commitId');
  updateCommit[TYPENAME].highestOrderCommitId = (commitDoc && commitDoc._doc.commitId) ? commitDoc._doc.commitId + 1 : 1;
  updateCommit[TYPENAME].nodeHighestOrderCommitIdUpdating = 0;

  updateCommit[TYPENAME].queue = new Queue(async (data, cb) => {
    const {commits} = data;
    // console.debug(getBaseSentryTags('updateCommitQueue'), 'List commit', JSON.stringify(commits));
    let newCommits = [];
    let lastTempId;
    let lastTable;
    for (let id in commits) {
      // preset value
      const commit = commits[id];
      commit.temp = false;
      if (lastTempId && lastTempId != commit.groupTempId && global.APP_CONFIG.isMaster) {
        const deleteCommit =
          await updateCommit.getMethod(TYPENAME, 'deleteTempCommit')({groupTempId: lastTempId});
        if (deleteCommit) newCommits.push(deleteCommit);
      }
      lastTempId = commit.groupTempId;
      // Accept commit in the last COMMIT_TIME_OUT
      if (!validateCommit(commit)) continue;
      const result = await updateCommit.getMethod(TYPENAME, commit.action)(commit);
      if (result) {
        if (commit.commitId) updateCommit[TYPENAME].highestOrderCommitId = commit.commitId + 1;
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
      const deleteCommit =
        await updateCommit.getMethod(TYPENAME, 'deleteTempCommit')({groupTempId: lastTempId});
      newCommits.push(deleteCommit);
      updateCommit.handler.emitToAll(newCommits);
    }
    cb(null);
  })
  updateCommit[TYPENAME].queue.pause();

  /* -------------- UpdateCommit Method -------------- */
  /*
  Delete temporary commit for order
   */
  updateCommit.registerMethod(TYPENAME, 'deleteTempCommit', async function ({groupTempId}) {
    let commit = null;
    await updateCommit.orderCommitModel.deleteMany({groupTempId, temp: true});
    commit = {
      type: TYPENAME,
      action: 'deleteTempCommit',
      groupTempId,
      temp: false,
      commitId: updateCommit[TYPENAME].highestOrderCommitId++
    }
    await updateCommit.orderCommitModel.create(commit);
    return commit;
  })

  updateCommit.registerMethod(TYPENAME, 'pushTaskToQueue', function (commits, ack) {
    updateCommit[TYPENAME].queue.push({
      commits,
      ack
    });
  })

  updateCommit.registerMethod(TYPENAME, 'resumeQueue', function () {
    updateCommit[TYPENAME].queue.resume();
  })

  /*
  nodeHighestOrderIdUpdating is for the case when node check master's
  highestOrderCommitId and send requireSync, the next time node check with
  master's highestOrderCommitId, the value must be updated but highestOrderCommitId
  of node may not be updated fast enough.
  */
  updateCommit.registerMethod(TYPENAME, 'checkHighestCommitId', function (id) {
    updateCommit[TYPENAME].nodeHighestOrderCommitIdUpdating =
      Math.max(updateCommit[TYPENAME].nodeHighestOrderCommitIdUpdating, updateCommit[TYPENAME].highestOrderCommitId);
    if (!id) return updateCommit[TYPENAME].nodeHighestOrderCommitIdUpdating;
    // node highest commit id must be equal to master
    return id <= updateCommit[TYPENAME].nodeHighestOrderCommitIdUpdating ? null : updateCommit[TYPENAME].nodeHighestOrderCommitIdUpdating;
  })

  updateCommit.registerMethod(TYPENAME, 'setHighestCommitId', function (id) {
    updateCommit[TYPENAME].nodeHighestOrderCommitIdUpdating = id;
  })

  updateCommit.registerMethod(TYPENAME, 'createOrder', async function (commit) {
    try {
      // Verify id for commit and order
      if (!validateOrderId(commit)) return;
      setCommitId(commit);
      // get query
      const query = JsonFn.parse(commit.update.query);
      if (commit.data.split) { // split order has been paid
        query.id = updateCommit[TYPENAME].highestOrderId;
        updateCommit[TYPENAME].highestOrderId++;
      }
      let result;
      if (commit.data.split) {
        result = await updateCommit.orderModel[commit.update.method](query);
        await updateCommit.orderCommitModel.create(commit);
      } else {
        if (updateCommit[TYPENAME].activeOrders[commit.data.table]) {
          console.error('Order has been created');
          return null;
        } else {
          query.date = new Date();
          query.online = false;
          result = await updateCommit.orderModel[commit.update.method](query);
          if (!result) return null;
          updateCommit[TYPENAME].activeOrders[commit.data.table] =
            (await updateCommit.orderModel.findOne({_id: query._id})).toJSON();
          commit.update.query = JSON.stringify(query);
          await updateCommit.orderCommitModel.create(commit);
        }
      }
			return true;
    } catch (err) {
      console.error('Error occurred', err);
      return null;
    }
  })

  updateCommit.registerMethod(TYPENAME, 'closeOrder', async function (commit) {
    try {
      // Verify id for commit and order
      let order;
      if (commit.data && commit.data.mutate) {
        if (!validateOrderId(commit)) return;
        const condition = getCondition(commit);
        if (commit.timeStamp && (new Date()).getTime() - commit.timeStamp > COMMIT_CLOSE_TIME_OUT) return null;
        if (!updateCommit[TYPENAME].activeOrders[commit.data.table]) {
          console.error('Order has been closed');
          return null;
        }
        delete updateCommit[TYPENAME].activeOrders[commit.data.table];
        setCommitId(commit);
        const query = JsonFn.parse(commit.update.query);
        await updateCommit.orderModel.findOneAndUpdate(condition, {$set: {id: updateCommit[TYPENAME].highestOrderId}});
        updateCommit[TYPENAME].highestOrderId++;
        order = await updateCommit.orderModel[commit.update.method](condition, query);
      } else {
        order = await updateCommit.orderModel.findOne(getCondition(commit));
      }
      await updateCommit.orderCommitModel.create(commit);
      if (commit.data.table) {
        await updateCommit.orderCommitModel.deleteMany({temp: true, table: commit.data.table})
      }
      await cms.execPostAsync('run:closeOrder', null, [commit, order]);
      return true;
    } catch (err) {
      console.error('Error occurred', err);
      return null;
    }
  })

  updateCommit.registerMethod(TYPENAME, 'addItem', async function (commit) {
    try {
      if (!checkOrderActive(commit)) return;
      const query = JsonFn.parse(commit.update.query);
      const condition = getCondition(commit);
      const result = await updateCommit.orderModel[commit.update.method](condition, query, {new: true});
      updateCommit[TYPENAME].activeOrders[commit.data.table] = result.toJSON();
      setCommitId(commit);
      query['$push']['items']._id = result._doc['items'][result._doc['items'].length - 1]._doc._id;
      commit.update.query = JsonFn.stringify(query);
      await updateCommit.orderCommitModel.create(commit);
      return true;
    } catch (err) {
      console.error('Error occurred', err);
      return null;
    }
  })

  updateCommit.registerMethod(TYPENAME, 'changeItemQuantity', async function (commit) {
    try {
      if (!checkOrderActive(commit)) return;
      const query = JsonFn.parse(commit.update.query);
      const condition = getCondition(commit);
      if (query['$inc'] && query['$inc']['items.$.quantity'] < 0) {
        const targetItem = updateCommit[TYPENAME].activeOrders[commit.data.table].items.find(item => {
          return item._id.toString() === condition['items._id'];
        })
        if (targetItem.quantity + query['$inc']['items.$.quantity'] < 0) {
          console.error('Can not reduce quantity to neg');
          return;
        }
        if (targetItem.printed) {
          if (!updateCommit[TYPENAME].activeOrders[commit.data.table].cancellationItems) updateCommit[TYPENAME].activeOrders[commit.data.table].cancellationItems = [];
          updateCommit[TYPENAME].activeOrders[commit.data.table].cancellationItems.push({
            ...targetItem,
            date: new Date(),
            quantity: -query['$inc']['items.$.quantity']
          })
          await updateCommit.orderModel.updateOne({_id: updateCommit[TYPENAME].activeOrders[commit.data.table]._id},
            {$set: {cancellationItems: updateCommit[TYPENAME].activeOrders[commit.data.table].cancellationItems}});
        }
      }
      const result = await updateCommit.orderModel[commit.update.method](condition, query, {new: true});
      updateCommit[TYPENAME].activeOrders[commit.data.table] = result.toJSON();
      setCommitId(commit);
      await updateCommit.orderCommitModel.create(commit);
      return true;
    } catch (err) {
      console.error('Error occurred', err);
      return null;
    }
  })

  updateCommit.registerMethod(TYPENAME, 'update', async function (commit) {
    try {
      if (!checkOrderActive(commit)) return;
      const query = JsonFn.parse(commit.update.query);
      const condition = getCondition(commit);
      const result = await updateCommit.orderModel[commit.update.method](condition, query, {new: true});
      if (result.status !== 'paid' && result.toJSON) {
        updateCommit[TYPENAME].activeOrders[commit.data.table] = result.toJSON();
      }
      commit.where = JsonFn.stringify(condition);
      setCommitId(commit);
      await updateCommit.orderCommitModel.create(commit);
      return true;
    } catch (err) {
      console.error('Error occurred', err);
      return null;
    }
  })

  updateCommit.registerMethod(TYPENAME, 'delete', async function (commit) {
    try {
      if (!checkOrderActive(commit)) return;
      const query = commit.update.query ? JsonFn.parse(commit.update.query) : {};
      const condition = getCondition(commit);
      await updateCommit.orderModel[commit.update.method](condition, query);
      if (commit.data.table) {
        delete updateCommit[TYPENAME].activeOrders[commit.data.table];
      }
      commit.where = JsonFn.stringify(condition);
      setCommitId(commit);
      await updateCommit.orderCommitModel.create(commit);
      if (commit.data.table) {
        await updateCommit.orderCommitModel.deleteMany({temp: true, table: commit.data.table})
      }
    } catch (err) {
      console.error('Error occurred', err);
      return null;
    }
  })

  updateCommit.registerMethod(TYPENAME, 'changeTable', async function (commit) {
    try {
      const result =
        await updateCommit.orderCommitModel.updateMany({groupTempId: commit.groupTempId}, {data: { table: commit.update, orderId: commit.data.orderId }}, {new: true});
      if (!result) return;
      updateCommit[TYPENAME].activeOrders[commit.update] = updateCommit[TYPENAME].activeOrders[commit.data.table];
      const condition = JsonFn.parse(commit.where);
      await updateCommit.orderModel.findOneAndUpdate(condition, {$set: {table: commit.update}})
      delete updateCommit[TYPENAME].activeOrders[commit.data.table];
      setCommitId(commit);
      await updateCommit.orderCommitModel.create(commit);
			return true;
    } catch (err) {
      console.error('Error occurred', err);
      return null;
    }
  })

  updateCommit.registerMethod(TYPENAME, 'requireSync', async function ({oldHighestCommitId, ack}) {
    try {
      const syncCommits = await updateCommit.orderCommitModel.find({commitId: {$gt: oldHighestCommitId - 1}});
      ack(syncCommits);
      return false;
    } catch (err) {
      console.error('Error occurred', err);
      return null;
    }
  })

  updateCommit.registerMethod(TYPENAME, 'updateTempCommit', async function (commits) {
    try {
      for (let i in commits) {
        await updateCommit.orderCommitModel.create(commits[i]);
      }
    } catch (err) {
      console.error('Error occurred', err);
      return null;
    }
  })

  updateCommit.registerMethod(TYPENAME, 'checkCommitExist', async function ({commitId}) {
    return updateCommit[TYPENAME].highestOrderCommitId > commitId;
  })

  updateCommit.registerMethod(TYPENAME, 'getNewOrderId', async function () {
    updateCommit[TYPENAME].highestOrderId++
    return updateCommit[TYPENAME].highestOrderId - 1
  })

  updateCommit.registerMethod(TYPENAME, 'doTask', function (commits) {
    updateCommit[TYPENAME].queue.push({
      commits
    });
  })

  updateCommit.registerMethod(TYPENAME, 'execPostAsync', async function (commit) {
    await cms.execPostAsync(commit.data.hook, null, [commit]);
  })

  /*
  temporary order is build by using temporary commits, apply mongoose
  query for them and return the final result
   */
  updateCommit.registerMethod(TYPENAME, 'buildTempOrder', async function (table) {
    let _id = new mongoose.Types.ObjectId();
    try {
      if (table == null) return null;
      const commitsList = await updateCommit.orderCommitModel.find({'data.table': table, temp: true}).lean();
      const tempCommit = updateCommit[TYPENAME].activeOrders[table] ? _.cloneDeep(updateCommit[TYPENAME].activeOrders[table]) : {items: []};
      tempCommit._id = _id;
      await updateCommit.orderModel.create(tempCommit);
      const promiseList = [];
      commitsList.forEach(commit => {
        if (commit.action !== 'createOrder') {
          const query = (commit.update.query ? JsonFn.parse(commit.update.query) : null);
          const condition = (commit.where ? JsonFn.parse(commit.where) : {});
          condition._id = _id;
          commit.update.method && promiseList.push(updateCommit.orderModel[commit.update.method](condition, query));
        }
      })
      await Promise.all(promiseList);
      const result = await updateCommit.orderModel.findOne({_id}).lean();
      if (result) {
        delete result._id;
        if (updateCommit[TYPENAME].activeOrders[table]) result._id = updateCommit[TYPENAME].activeOrders[table]._id;
      }
      await updateCommit.orderModel.deleteMany({_id});
      return result;
    } catch (err) {
      await updateCommit.orderModel.deleteMany({_id});
      console.error('Error occurred', err);
      return null;
    }
  })

  updateCommit.registerMethod(TYPENAME, 'printOrder', async function (commit) {
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
