const Queue = require('better-queue');

async function handleCommit(commitContainer) {
  const TYPENAME = 'inventoryCategory';
  const INVENTORY_CATEGORY_COL = 'InventoryCategory'
  if (!commitContainer[TYPENAME]) {
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
  }

  commitContainer.registerMethod(TYPENAME, 'create', async function({ name }) {
    const cate = await cms.getModel(INVENTORY_CATEGORY_COL).findOne({name})
    if (!cate)
      await cms.getModel(INVENTORY_CATEGORY_COL).create({name})
  })

  commitContainer.registerMethod(TYPENAME, 'update', async function({ _id, name }) {
    await cms.getModel(INVENTORY_CATEGORY_COL).updateOne({ _id }, { name })
  })

  commitContainer.registerMethod(TYPENAME, 'delete', async function({ _id }) {
    // TODO:
    // await cms.getModel(INVENTORY_CATEGORY_COL).delete({_id})
  })

  // default interface methods
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
