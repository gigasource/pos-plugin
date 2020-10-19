// TODO: UI notification
const Queue = require('better-queue');

async function handleCommit(commitContainer) {
  const TYPENAME = 'inventory';
  const INVENTORY_COL = 'inventory'
  const INVENTORY_HISTORY_COL = 'inventoryHistory'

  if (!commitContainer[TYPENAME])
    commitContainer[TYPENAME] = {}

  commitContainer[TYPENAME].queue = new Queue(async (data, cb) => {
    const { commits } = data;
    for (let commit of commits) {
      await commitContainer.getMethod(TYPENAME, commit.action)(commit);
    }
    cb(null);
  });
  commitContainer[TYPENAME].queue.pause();

  commitContainer.registerMethod(TYPENAME, 'resumeQueue', function() {
    commitContainer[TYPENAME].queue.resume();
  })

  commitContainer.registerMethod(TYPENAME, 'create', async function({ name, stock, categoryId, unit, lowStockThreshold, by }) {
    let inventory = await cms.getModel(INVENTORY_COL).findOne({name})
    if (!inventory) {
      inventory = await cms.getModel(INVENTORY_COL).create({ name, stock, categoryId, unit, lowStockThreshold, by })
      await cms.getModel(INVENTORY_HISTORY_COL).create({
        timestamp: new Date().getTime(),
        by,
        inventories: [{
          inventory: inventory._id,
          change: stock,
          action: 'add'
        }]
      })
    }
  })

  commitContainer.registerMethod(TYPENAME, 'update', async function({ _id, name, categoryId, unit, lowStockThreshold, by }) {
    await cms.getModel(INVENTORY_COL).updateOne({_id}, { name, categoryId, unit, lowStockThreshold, by })
  })

  commitContainer.registerMethod(TYPENAME, 'delete', async function({ _id, by }) {
    // TODO: delete existed inventory
  })

  commitContainer.registerMethod(TYPENAME, 'import', async function({ by, timestamp, inventories, inventoriesLoadTimestamp }) {
    if (!inventories || !Array.isArray(inventories)) {
      return console.log('inventoryCommit:import', 'Invalid inventories data')
    }
    // convert inventories => keypair collection a.k.a object
    // TODO: Resolve conflict
    const stockChanges = _.reduce(inventories, (output, v) => {
      output[v.inventory] = v.added;
      return output;
    }, {});
    const affectIds = inventories.map(item => item._id)
    const affectItems = await cms.getModel(INVENTORY_COL).find({ _id: { $in: affectIds } })
    const bulkUpdateData = affectItems.map(item => ({
      find: { _id: item._id },
      update: {...item, stock: item.stock + stockChanges[item._id]}
    }))
    await cms.getModel(INVENTORY_COL).bulkUpdate(bulkUpdateData)
    await cms.getModel(INVENTORY_HISTORY_COL).create({
      timestamp : new Date().getTime(),
      inventories: inventories.map(item => ({
        inventory: item.inventory,
        change: item.added,
        action: 'add'
      })),
      by
    })
  })

  // implement default interface
  commitContainer.registerMethod(TYPENAME, 'doTask', async function(commits) {
    commitContainer[TYPENAME].queue.push({
      commits
    })
  })
  commitContainer.registerMethod(TYPENAME, 'checkCommitExist', async function({ commitId }) {
    return false;
  })
  commitContainer.registerMethod(TYPENAME, 'setHighestCommitId', async function(commit) {
  })
}

module.exports = handleCommit
