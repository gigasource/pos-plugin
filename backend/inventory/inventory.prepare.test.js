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
	const Category = orm('Category')
	const InventoryAction = orm('InventoryAction')
	const Product = orm('Product')
	await Inventory.remove({})
	await Category.remove({})
	await InventoryAction.remove({})
	await Product.remove({})

	const makeProduct = async function (product) {
		product.appType = 'POS_RESTAURANT'
		return await Product.create(product)
	}

	const makeCategory = async function (categoryName) {
		return await Category.create({
			_id: new ObjectID(),
			name: categoryName,
			appType: 'POS_RESTAURANT'
		})
	}

	const makeInventory = async function (inventory) {
		const createdInventory = await Inventory.create({
			_id: new ObjectID(),
			...inventory,
			appType: 'POS_RESTAURANT',
		})
		await InventoryAction.create({
			_id: new ObjectID(),
			inventory: createdInventory._id,
			type: 'add',
			amount: inventory.stock,
			appType: 'POS_RESTAURANT',
			date: inventory.lastUpdateTimestamp
		})
	}

	const foodCategory = await makeCategory('Food')
	const fruitCategory = await makeCategory('Fruit')
	const drinkCategory = await makeCategory('Drink')

	const products = [
		{id: '1', name: 'Fish', category: [foodCategory._id]},
		{id: '2', name: 'Meat', category: [foodCategory._id]},
		{id: '3', name: 'Pork', category: [foodCategory._id]},
		{id: '4', name: 'Apple', category: [fruitCategory._id]},
		{id: '5', name: 'Banana', category: [fruitCategory._id]},
		{id: '6', name: 'Vodka', category: [drinkCategory._id]}
	]

	for (let i in products) {
		products[i] = await makeProduct(products[i])
	}

	const inventories = [
		{productId: products[0]._id, unit: 'kg', stock: 30, id: '1', lastUpdateTimestamp: genDate()},
		{productId: products[1]._id, unit: 'kg', stock: 50, id: '2', lastUpdateTimestamp: genDate()},
		{productId: products[2]._id, unit: 'kg', stock: 60.22, id: '3', lastUpdateTimestamp: genDate()},
		{productId: products[3]._id, unit: 'piece', stock: 100, id: '4', lastUpdateTimestamp: genDate()},
		{productId: products[4]._id, unit: 'piece', stock: 10, id: '5', lastUpdateTimestamp: genDate()},
		{productId: products[5]._id, unit: 'l', stock: 5.5, id: '6', lastUpdateTimestamp: genDate()},
	]

	for (let inventory of inventories) {
		await makeInventory(inventory)
	}
}

module.exports = {
	prepareInventoryDb
}
