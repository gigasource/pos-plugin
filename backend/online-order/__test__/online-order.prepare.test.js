const { orders } = require('./mockOrders')

async function prepareOnlineOrderDb(orm) {
	const Order = orm('Order')
	await Order.remove({}).direct()
	for (let order of orders) {
		await Order.create(order).direct()
	}
}

module.exports = {
	prepareOnlineOrderDb
}
