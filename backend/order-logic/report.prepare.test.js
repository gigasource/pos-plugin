import {nextTick} from "vue";
import {
	addPayment,
	addModifier,
	addUser,
	addItem,
	createOrder,
	cancelOrder,
	makeEOD,
	makePaid,
	makeTakeaway,
	makeLastItemDiscount,
	removeItem} from "../../components2/OrderView/pos-logic";
const moment = require("moment");

async function prepareDb(orm) {
	const Order = orm('Order')
	await Order.remove({});
	const foodTax = {taxes: [5, 10]};
	const drinkTax = {taxes: [16, 32]};

	const cola = {name: "Cola", price: 1.3, category: "drink", ...drinkTax};
	const fanta = {name: "Fanta", price: 2, category: "drink", ...drinkTax};
	const rice = {name: "Rice", price: 10, category: "food", ...foodTax};
	const ketchup = {name: "Add Ketchup", price: 3};

	async function makeOrder(initValue, cb, afterPaidCb) {
		let order = createOrder(initValue);
		if (cb) await cb(order);
		makePaid(order);
		afterPaidCb && afterPaidCb(order);
		await nextTick();
		await Order.create(order);
	}

	await makeOrder({date: new Date()}, async order => {
		addItem(order, cola, 1);
		addItem(order, fanta, 2);
		addPayment(order, "cash");
		order.date = moment("05.01.2021", "DD.MM.YYYY").toDate();
		makeEOD(order, 1);
		addUser(order, "Waiter 1");
	});

	await makeOrder({date: new Date()}, async order => {
		addItem(order, cola, 1);
		addItem(order, rice, 2);
		removeItem(order, 1, 1);
		addModifier(order, ketchup);
		addPayment(order, [{type: "card", value: 2}, {type: "cash"}]);
		order.date = moment("05.01.2021", "DD.MM.YYYY").toDate();
		makeEOD(order, 1);
		addUser(order, "Waiter 2");
	});

	await makeOrder(
		{date: new Date()},
		async order => {
			addItem(order, cola, 2);
			removeItem(order, 0, 1);
			makeTakeaway(order);
			addPayment(order, "cash");
			order.date = moment("05.01.2021", "DD.MM.YYYY").toDate();
			makeEOD(order, 1);
			addUser(order, "Waiter 1");
		},
		async order => {
			cancelOrder(order);
		}
	);

	await makeOrder({date: new Date()}, async order => {
		addItem(order, cola, 1);
		makeLastItemDiscount(order, "40%");
		addPayment(order, "card");
		order.date = moment("06.01.2021", "DD.MM.YYYY").toDate();
		makeEOD(order, 2);
		addUser(order, "Waiter 1");
	});
}

module.exports = {
	prepareDb
}
