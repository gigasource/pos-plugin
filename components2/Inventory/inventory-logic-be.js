import cms from 'cms'
import {
	inventories,
	inventoryCategories
} from './inventory-logic-ui'
import {ObjectID} from "bson"
import _ from 'lodash'

const Inventory = cms.getModel('Inventory')
const InventoryCategory = cms.getModel('InventoryCategory')
const InventoryHistory = cms.getModel('InventoryHistory')

export async function loadInventories() {
	inventories.value = await Inventory.find()
}

export async function loadInventoryCategories() {
	inventoryCategories.value = await InventoryCategory.find()
}

export async function createInventory(inventory) {
	await Inventory.create(inventory)
	inventories.value.push(inventory)
}

export async function updateInventory({ _id, name, category, unit, stock, lowStockThreshold }, reason) {
	category = (typeof category === 'object' ? category._id : category)
	let inventory = _.find(inventories.value, (inventory) => inventory._id.toString() === _id.toString())
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
	inventory = {
		_id,
		name,
		category,
		unit,
		stock,
		lowStockThreshold
	}
	await Inventory.findOneAndUpdate(
		{ _id },
		{
			name, category, unit, stock, lowStockThreshold, lastUpdateTimestamp: new Date()
		}
	)
}

export async function updateInventoryHistory(history) {
	await InventoryHistory.create(history)
}

export async function deleteInventory(ids) {
	_.remove(inventories.value, (inventory) => {
		return ids.includes(inventory._id.toString())
	})
	ids = ids.map(id => ObjectID(id))
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
