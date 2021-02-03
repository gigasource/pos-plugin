import { watch } from 'vue'
import cms from 'cms'
import {
	inventories,
	inventoryCategories,
	hooks
} from './inventory-logic-ui'
import dayjs from 'dayjs'
import {ObjectID} from "bson"
import _ from 'lodash'
import {appType, currentAppType} from "../AppSharedStates";

const InventoryModel = {
	[appType.POS_RESTAURANT]: cms.getModel('Inventory'),
	[appType.POS_RETAIL]: cms.getModel('InventoryRetail')
}
const InventoryCategoryModel = {
	[appType.POS_RESTAURANT]: cms.getModel('InventoryCategory'),
	[appType.POS_RETAIL]: cms.getModel('InventoryRetailCategory'),
}
const InventoryHistoryModel = {
	[appType.POS_RESTAURANT]: cms.getModel('InventoryHistory'),
	[appType.POS_RETAIL]: cms.getModel('InventoryRetailHistory'),
}

export function selectModel(modelType) {
	return currentAppType.value === appType.POS_RESTAURANT ? modelType[appType.POS_RESTAURANT] : modelType[appType.POS_RETAIL]
}

let Inventory = selectModel(InventoryModel)
let InventoryCategory = selectModel(InventoryCategoryModel)
let InventoryHistory = selectModel(InventoryHistoryModel)

watch(() => currentAppType.value, () => {
	Inventory = selectModel(InventoryModel)
	InventoryCategory = selectModel(InventoryCategoryModel)
	InventoryHistory = selectModel(InventoryHistoryModel)
})

export async function loadInventories() {
	inventories.value = await Inventory.find()
	hooks.emit('after:loadInventory')
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

export async function updateInventory(_inventory, reason) {
	const inventory = _.find(inventories.value, (inventory) => inventory._id.toString() === _inventory._id.toString())
	_inventory.category = ((_inventory.category._bsontype || typeof _inventory.category === 'string') ? inventoryCategories.value.find(_category => _category._id.toString() === _inventory.category.toString()) : _inventory.category)
	if (_inventory.stock !== inventory.stock) {
		const history = {
			inventory: _inventory._id,
			category: _inventory.category._id,
			type: _inventory.stock > inventory.stock ? 'add' : 'remove',
			amount: Math.abs(_inventory.stock - inventory.stock),
			date: new Date(),
			reason: reason ? reason : 'Update stock'
		}
		await updateInventoryHistory(history)
	}
	Object.assign(inventory, _inventory, {
		lastUpdateTimestamp: new Date()
	})
	await Inventory.findOneAndUpdate(
		{ _id: _inventory._id },
		inventory
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
