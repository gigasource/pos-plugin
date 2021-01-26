const moment = require('moment')

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
			name: categoryName,
			available: false
		})
	}

	const makeInventory = async function (inventory) {
		const createdInventory = await Inventory.create(inventory)
		await InventoryHistory.create({
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

module.exports = {
	prepareInventoryDb
}
