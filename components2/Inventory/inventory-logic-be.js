import cms from 'cms'
import {
	inventories,
	inventoryCategories,
	inventoryHistories
} from './inventory-logic-ui'
import {ObjectID} from "bson"
import _ from 'lodash'

const Inventory = cms.getModel('Inventory')
const InventoryCategory = cms.getModel('InventoryCategory')
const InventoryHistory = cms.getModel('InventoryHistory')

export async function loadInventories() {
	const _inventories = await Inventory.find()
	inventories.value = _inventories.map(item => ({
		...item,
		category: inventoryCategories.value.find(cate => cate._id.toString() === item.category.toString())
	}))
}

export async function loadInventoryCategories() {
	inventoryCategories.value = await InventoryCategory.find()
}

export async function loadInventoryHistories() {
	inventoryHistories.value = await InventoryHistory.find()
}

export async function createInventory(inventory) {
	if (!inventory.id) {
		const maxId = inventories.value.reduce((maxId, inventory) => {
			return Math.max(maxId, parseInt(inventory.id))
		}, 0)
		inventory.id = (maxId ? maxId + 1 : 0)
	} else {
		const foundId = inventories.value.find(_inventory => {
			return inventory.id === _inventory.id
		})
		if (foundId) return
	}
	inventory.lastUpdateTimestamp = new Date()
	inventories.value.push(_.cloneDeep(inventory))
	inventory.category = (typeof inventory.category === 'Object' ? inventory.category._id : inventory.category)
	await Inventory.create(inventory)
}

export async function updateInventory({ _id, name, category, unit, stock, lowStockThreshold }, reason) {
	const inventory = _.find(inventories.value, (inventory) => inventory._id.toString() === _id.toString())
	Object.assign(inventory, {
		name,
		category,
		unit,
		stock,
		lowStockThreshold,
		lastUpdateTimestamp: new Date()
	})
	category = (typeof category === 'object' ? category._id : category)
	if (stock !== inventory.stock) {
		const history = {
			inventory: _id,
			category,
			type: stock.value > inventory.stock ? 'add' : 'remove',
			amount: Math.abs(stock.value - inventory.stock),
			date: new Date(),
			reason: reason ? reason : 'Update stock'
		}
		await updateInventoryHistory(history)
	}
	await Inventory.findOneAndUpdate(
		{ _id },
		{
			name, category, unit, stock, lowStockThreshold, lastUpdateTimestamp: new Date()
		}
	)
}

export async function updateInventoryHistory(history) {
	inventoryHistories.value.push(history)
	await InventoryHistory.create(history)
}

export async function deleteInventory(ids) {
	_.remove(inventories.value, (inventory) => {
		return ids.includes(inventory._id)
	})
	const inventoriesDeleted = await Inventory.find({_id: {$in: ids}})
	const result = await Inventory.deleteMany({_id: {$in: ids}})
	if(result.n === ids.length) {
		const histories = inventoriesDeleted.value.map(i => ({
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
