import cms from 'cms'
import {
	inventories,
	inventoryCategories
} from './inventory-logic-ui'
import dayjs from 'dayjs'
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

export async function loadInventoryHistories(filter) {
	const condition = {}
	if (filter.fromDate) {
		const fromDate = dayjs(filter.fromDate).startOf('day').toDate()
		const toDate = dayjs(filter.toDate).endOf('day').toDate()
		Object.assign(condition, {date: {$gte: fromDate, $lte: toDate}})
	}
	return await InventoryHistory.find(condition).sort({date: -1})
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
	if (!inventory._id) {
		inventory._id = new ObjectID()
	}
	inventory.lastUpdateTimestamp = new Date()
	inventories.value.push(_.cloneDeep(inventory))
	inventory.category = inventory.category._id

	await Inventory.create(inventory)
	// update history
	await updateInventoryHistory({
		inventory: inventory._id,
		category: inventory.category,
		type: 'add',
		amount: inventory.stock,
		date: new Date(),
		reason: 'Create inventory'
	})
}

export async function updateInventory({ _id, name, category, unit, stock, lowStockThreshold }, reason) {
	const inventory = _.find(inventories.value, (inventory) => inventory._id.toString() === _id.toString())
	category = ((category._bsontype || typeof category === 'string') ? inventoryCategories.value.find(_category => _category._id.toString() === category.toString()) : category)
	if (stock !== inventory.stock) {
		const history = {
			inventory: _id,
			category: category._id,
			type: stock > inventory.stock ? 'add' : 'remove',
			amount: Math.abs(stock - inventory.stock),
			date: new Date(),
			reason: reason ? reason : 'Update stock'
		}
		await updateInventoryHistory(history)
	}
	Object.assign(inventory, {
		name,
		category,
		unit,
		stock,
		lowStockThreshold,
		lastUpdateTimestamp: new Date()
	})
	await Inventory.findOneAndUpdate(
		{ _id },
		{
			name, category: category._id, unit, stock, lowStockThreshold, lastUpdateTimestamp: new Date()
		}
	)
}

export async function updateInventoryHistory(history) {
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

export async function deleteInventoryCategory(_id) {
	_.remove(inventoryCategories.value, (category) => {
		return _id.toString() === category._id.toString()
	})
	await InventoryCategory.deleteOne({ _id })
}

export async function updateInventoryCategories(newInventoryCategory) {
	for (const category of newInventoryCategory) {
		if (category._id) {
			await InventoryCategory.findOneAndUpdate({_id: category._id}, category)
		} else {
			category._id = new ObjectID()
			await InventoryCategory.create(category)
		}
	}
	inventoryCategories.value = newInventoryCategory
}