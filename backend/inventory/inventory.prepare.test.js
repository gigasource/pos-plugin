const moment = require('moment')
const { ObjectID } = require('bson')

/**
 * All date will be 05/01/2021
 */
function genDate() {
	return moment("05.01.2021", "DD.MM.YYYY").toDate()
}

async function prepareInventoryDb(orm) {
	const Inventory = orm('Inventory')
	const InventoryCategory = orm('InventoryCategory')
	const InventoryHistory = orm('InventoryHistory')
	await Inventory.remove({})
	await InventoryCategory.remove({})
	await InventoryHistory.remove({})
	const makeCategory = async function (categoryName) {
		return await InventoryCategory.create({
			_id: new ObjectID(),
			name: categoryName,
			available: false
		})
	}

	const makeInventory = async function (inventory) {
		const createdInventory = await Inventory.create({
			_id: new ObjectID(),
			...inventory
		})
		await InventoryHistory.create({
			_id: new ObjectID(),
			inventory: createdInventory._id,
			category: createdInventory.category,
			type: 'add',
			amount: inventory.stock,
			date: inventory.lastUpdateTimestamp
		})
	}

	const foodCategory = await makeCategory('Food')
	const fruitCategory = await makeCategory('Fruit')
	const drinkCategory = await makeCategory('Drink')

	const inventories = [
		{name: 'Fish', category: foodCategory._id, unit: 'kg', stock: 30, id: '1', lastUpdateTimestamp: genDate()},
		{name: 'Meat', category: foodCategory._id, unit: 'kg', stock: 50, id: '2', lastUpdateTimestamp: genDate()},
		{name: 'Pork', category: foodCategory._id, unit: 'kg', stock: 60.22, id: '3', lastUpdateTimestamp: genDate()},
		{name: 'Apple', category: fruitCategory._id, unit: 'piece', stock: 100, id: '4', lastUpdateTimestamp: genDate()},
		{name: 'Banana', category: fruitCategory._id, unit: 'piece', stock: 10, id: '5', lastUpdateTimestamp: genDate()},
		{name: 'Vodka', category: drinkCategory._id, unit: 'l', stock: 5.5, id: '6', lastUpdateTimestamp: genDate()},
	]

	for (let inventory of inventories) {
		await makeInventory(inventory)
	}
}

async function prepareInventoryRetailDb(orm) {
	const InventoryRetail = orm('Inventory')
	const InventoryRetailCategory = orm('InventoryCategory')
	const InventoryRetailHistory = orm('InventoryHistory')
	await InventoryRetail.remove({})
	await InventoryRetailCategory.remove({})
	await InventoryRetailHistory.remove({})

	const makeRetailCategory = async function (categoryName, subCategory) {
		for (let _subCategory of subCategory) {
			_subCategory._id = new ObjectID()
		}
		return await InventoryRetailCategory.create({
			_id: new ObjectID(),
			name: categoryName,
			subCategory: subCategory,
			available: !subCategory.length
		})
	}

	const makeInventoryRetail = async function (inventory) {
		const createdInventory = await InventoryRetail.create({
			_id: new ObjectID(),
			...inventory
		})
		await InventoryRetailHistory.create({
			_id: new ObjectID(),
			inventory: createdInventory._id,
			category: createdInventory.category,
			type: 'add',
			amount: inventory.stock,
			date: inventory.lastUpdateTimestamp
		})
		return createdInventory
	}

	const foodCategory = await makeRetailCategory('Food', [{name: 'Vegetables'}])
	const fruitCategory = await makeRetailCategory('Fruit')
	const drinkCategory = await makeRetailCategory('Drink', [{name: 'Wine'}, {name: 'Soda'}])

	const inventories = [
		{name: 'Fish', category: foodCategory._id, unit: 'kg', stock: 30, id: '1', lastUpdateTimestamp: genDate(), price: 30, unitCostPrice: 10, isFavorite: false, isVoucher: false, isActive: true, isRefundable: false, showOnOrderScreen: true, manualPrice: false, hasComboIngredient: false, attributes: [], comboIngredient: []},
		{name: 'Meat', category: foodCategory._id, unit: 'kg', stock: 50, id: '2', lastUpdateTimestamp: genDate(), price: 20, unitCostPrice: 15, isFavorite: true, isVoucher: false, isActive: true, isRefundable: true, showOnOrderScreen: true, manualPrice: true, hasComboIngredient: false, attributes: [], comboIngredient: []},
		{name: 'Pork', category: foodCategory._id, unit: 'kg', stock: 60.22, id: '3', lastUpdateTimestamp: genDate(), price: 55, unitCostPrice: 30, isFavorite: true, isVoucher: false, isActive: true, isRefundable: false, showOnOrderScreen: true, manualPrice: false, hasComboIngredient: false, attributes: [], comboIngredient: []},
		{name: 'Apple', category: fruitCategory._id, unit: 'piece', stock: 100, id: '4', lastUpdateTimestamp: genDate(), price: 100, unitCostPrice: 50, isFavorite: true, isVoucher: false, isActive: true, isRefundable: false, showOnOrderScreen: false, manualPrice: false, hasComboIngredient: false, attributes: [{color: 'red'}], comboIngredient: []},
		{name: 'Banana', category: fruitCategory._id, unit: 'piece', stock: 10, id: '5', lastUpdateTimestamp: genDate(), price: 17, unitCostPrice: 4, isFavorite: true, isVoucher: false, isActive: true, isRefundable: false, showOnOrderScreen: true, manualPrice: false, hasComboIngredient: false, attributes: [{size: 'big'}], comboIngredient: []},
		{name: 'Vodka', category: drinkCategory._id, unit: 'l', stock: 5.5, id: '6', lastUpdateTimestamp: genDate(), price: 44, unitCostPrice: 22, isFavorite: true, isVoucher: false, isActive: true, isRefundable: false, showOnOrderScreen: true, manualPrice: false, hasComboIngredient: false, attributes: [], comboIngredient: []},
	]

	inventories.map(async inventory => {
		return await makeInventoryRetail(inventory)
	})

	const combos = [
		{name: 'ComboFishMeat', category: foodCategory._id, unit: 'piece', stock: 1, id: '7', lastUpdateTimestamp: genDate(), price: 55, unitCostPrice: inventories[0].unitCostPrice + inventories[1].unitCostPrice, isFavorite: true, isVoucher: false, isActive: true, isRefundable: false, showOnOrderScreen: true, manualPrice: false, hasComboIngredient: true, attributes: [], comboIngredient: [{ _id: inventories[0]._id, quantity: 20 },  { _id: inventories[1]._id, quantity: 1 }]}
	]

	combos.map(async combo => {
		return await makeInventoryRetail(combo)
	})
}

module.exports = {
	prepareInventoryDb
}
