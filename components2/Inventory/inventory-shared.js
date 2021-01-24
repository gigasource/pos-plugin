import { ref } from 'vue'
import cms from 'cms'
import { ObjectID } from 'bson'

const INVENTORY_COL = 'Inventory'
const INVENTORY_CATEGORY_COL = 'InventoryCategory'
const INVENTORY_UNIT_COL = 'InventoryUnit'
const INVENTORY_HISTORY_COL = 'InventoryHistory'
const COMMIT_COL = 'OrderCommit'

const inventories = ref([])
const inventoryCategories = ref([])
const inventoriesLoadTimestamp = ref(null)

export async function updateInventoryHistory(history) {
  await cms.getModel(INVENTORY_HISTORY_COL).create(history)
}

export async function loadInventories(filters = []) {
  const condition = filters.reduce((acc, filter) => ({...acc, ...filter['condition']}), {})
  const _inventories = await cms.getModel(INVENTORY_COL).find(condition)
  const _categories = await cms.getModel(INVENTORY_CATEGORY_COL).find()
  inventories.value = _inventories.map(item => ({
    ...item,
    category: _categories.find(cate => cate._id.toString() === item.category)
  }))
  inventoriesLoadTimestamp.value = new Date().getTime()
}

export async function loadInventoryCategories() {
  inventoryCategories.value = await cms.getModel(INVENTORY_CATEGORY_COL).find({})
}

export async function updateInventory({ _id, name, category, unit, stock, lowStockThreshold }) {
  await cms.getModel(INVENTORY_COL).findOneAndUpdate(
    { _id: new ObjectID() },
    {
      name, category, unit, stock, lowStockThreshold, lastUpdateTimestamp: new Date()
    }
  )
}

export async function  deleteInventory(ids) {
  ids = ids.map(id => ObjectID(id))
  const inventories = await cms.getModel(INVENTORY_COL).find({_id: {$in: ids}})
  const result = await cms.getModel(INVENTORY_COL).deleteMany({_id: {$in: ids}})
  if(result.n === ids.length) {
    const histories = inventories.value.map(i => ({
      inventory: i._id.toString(),
      category: i.category,
      type: 'remove',
      amount: i.stock,
      date: new Date(),
      reason: 'Remove inventory',
    }))
    await updateInventoryHistory(histories)
  }
}
