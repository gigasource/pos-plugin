import cms from 'cms'
import {
	inventories,
	hooks
} from './inventory-logic-ui'
import dayjs from 'dayjs'
import {ObjectID} from "bson"
import _ from 'lodash'

const Inventory = cms.getModel('Inventory')
const InventoryAction = cms.getModel('InventoryAction')

export async function loadInventories() {
	inventories.value = await Inventory.find()
	hooks.emit('after:loadInventory')
}

export async function loadInventoryActions(filter) {
	const condition = {}
	if (filter.fromDate) {
		const fromDate = dayjs(filter.fromDate).startOf('day').toDate()
		const toDate = dayjs(filter.toDate).endOf('day').toDate()
		Object.assign(condition, {date: {$gte: fromDate, $lte: toDate}})
	}
	return await InventoryAction.find(condition).sort({date: -1})
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

	await Inventory.create(inventory)
	// update action
	await updateInventoryAction({
		inventory: inventory._id,
		type: 'add',
		amount: inventory.stock,
		date: new Date(),
		reason: 'Create inventory'
	})
}

export async function updateInventory(_inventory, reason) {
	const inventory = _.find(inventories.value, (inventory) => inventory._id.toString() === _inventory._id.toString())
	if (_inventory.stock !== inventory.stock) {
		const action = {
			inventory: _inventory._id,
			type: _inventory.stock > inventory.stock ? 'add' : 'remove',
			amount: Math.abs(_inventory.stock - inventory.stock),
			date: new Date(),
			reason: reason ? reason : 'Update stock'
		}
		await updateInventoryAction(action)
	}
	Object.assign(inventory, _inventory, {
		lastUpdateTimestamp: new Date()
	})
	await Inventory.findOneAndUpdate(
		{ _id: _inventory._id },
		inventory
	)
}

export async function updateInventoryAction(action) {
	await InventoryAction.create(action)
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
			type: 'remove',
			amount: i.stock,
			date: new Date(),
			reason: 'Remove inventory',
		}))
		await updateInventoryAction(histories)
	}
}

export async function removeFromInventory(removedInventoryItems) {
	removedInventoryItems = hooks.emit('before:removeFromInventory', removedInventoryItems).value
	// There are some items out of stock
	if (removedInventoryItems.find(item => item.outOfStock))
		return removedInventoryItems
	for (let removedItem of removedInventoryItems) {
		const inventory = inventories.value.find(inventory => inventory._id.toString() === removedItem._id.toString())
		inventory.stock -= removedItem.quantity
		await updateInventory(inventory)
	}
}
