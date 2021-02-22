const {ObjectID} = require('bson')

/**
 *
 * @param date {Date} current date
 * @param interval {Number} time interval in second
 * @example
 * genDateInFuture(new Date(), 300)
 */
function genDateInFuture(date, interval) {
	return new Date(date.getTime() + interval * 1000)
}

const orders = [{
	"printer": [],
	"_id": new ObjectID("5ffffadd207bc21ece71a2db"),
	"id": 1,
	"status": "completed",
	"items": [{
		"taxes": [],
		"_id": new ObjectID("5ffffadd207bc21ece71a2dc"),
		"id": "",
		"name": "Pepe",
		"price": 12,
		"tax": 7,
		"quantity": 1,
		"modifiers": [],
		"groupPrinter": "Kitchen",
		"category": "1",
		"originalPrice": 12,
		"attributes": []
	}],
	"customer": {
		"name": "fgh",
		"company": "",
		"phone": "0123123131",
		"address": "",
		"zipCode": "",
		"deliveryTime": "",
		"distance": null
	},
	"deliveryDate": new Date("2021-01-14T08:03:41.193Z"),
	"payment": [{"_id": new ObjectID("5e0b00e1c0aa5a17f5ab84ab"), "value": 12, "type": "cash"}],
	"type": "pickup",
	"date": new Date("2021-01-14T08:03:36.457Z"),
	"vDate": new Date("2021-01-13T17:00:00.000Z"),
	"bookingNumber": "210114150336457",
	"shippingFee": 0,
	"vSum": 12,
	"vTax": 0.79,
	"vTaxGroups": [{"_id": new ObjectID("5ffffadd207bc21ece71a2de"), "taxType": 7, "tax": 0.79, "sum": 12}],
	"vDiscount": 0,
	"online": true,
	"note": "",
	"onlineOrderId": "0159c1c0-563f-11eb-accb-3564ab607d04",
	"discounts": [],
	"deliveryTime": "15:33",
	"user": [{"_id": new ObjectID("5e1d89f200971c2ac29fcccb"), "name": "admin"}],
	"commits": [],
	"declineReason": "",
	"prepareTime": 30
}, {
	"printer": [],
	"_id": new ObjectID("600fe75dbd5c7e5549974874"),
	"id": 2,
	"status": "kitchen",
	"items": [{
		"taxes": [],
		"_id": new ObjectID("600fe75dbd5c7e5549974875"),
		"id": "3",
		"image": "/cms-files/files/view/Restaurant%20Plus%20images/75ABE9D7-3244-494D-BDF3-F6E3EED92699.png",
		"name": "mon test",
		"desc": "In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. ",
		"price": 0.1,
		"tax": 7,
		"quantity": 1,
		"modifiers": [],
		"groupPrinter": "Kitchen",
		"groupPrinter2": "false",
		"category": "1",
		"originalPrice": 0.1,
		"attributes": []
	}],
	"customer": {
		"name": "xa",
		"company": "",
		"phone": "01234",
		"address": "",
		"zipCode": "",
		"deliveryTime": "",
		"distance": null
	},
	"deliveryDate": new Date("2021-01-26T09:56:45.029Z"),
	"payment": [{"_id": new ObjectID("5e0b00e1c0aa5a17f5ab84ab"), "value": 0.1, "type": "cash"}],
	"type": "pickup",
	"date": new Date("2021-01-26T09:56:43.201Z"),
	"timeoutDate": new Date("2021-01-26T10:01:43.201Z"),
	"vDate": new Date("2021-01-25T17:00:00.000Z"),
	"bookingNumber": "210126165643201",
	"shippingFee": 0,
	"vSum": 0.1,
	"vTax": 0.01,
	"vTaxGroups": [{"_id": new ObjectID("600fe75dbd5c7e5549974877"), "taxType": 7, "tax": 0.01, "sum": 0.1}],
	"vDiscount": 0,
	"online": true,
	"note": "",
	"onlineOrderId": "cb60ef30-5fbc-11eb-a77a-a1ad16df7dd7",
	"discounts": [],
	"deliveryTime": "17:27",
	"user": [{"_id": new ObjectID("5e1d89f200971c2ac29fcccb"), "name": "admin"}],
	"commits": [],
	"declineReason": "",
	"prepareTime": 30
}, {
	"printer": [],
	"_id": new ObjectID("600fe788bd5c7e554997488f"),
	"id": 3,
	"status": "kitchen",
	"items": [{
		"taxes": [],
		"_id": new ObjectID("600fe788bd5c7e5549974890"),
		"id": "4",
		"image": "/cms-files/files/view/images/DSCF7485.jpg",
		"name": "VIT THAI XOAI | MANGO IN THE „DUCK\"",
		"price": 9,
		"tax": 7,
		"quantity": 1,
		"modifiers": [],
		"groupPrinter": "Kitchen",
		"groupPrinter2": "false",
		"category": "1",
		"originalPrice": 10,
		"discountUnit": "amount",
		"vDiscount": 1,
		"attributes": []
	}],
	"customer": {
		"name": "xa",
		"company": "",
		"phone": "0123",
		"address": "",
		"zipCode": "",
		"deliveryTime": "",
		"distance": null
	},
	"deliveryDate": new Date("2021-01-26T09:57:28.770Z"),
	"payment": [{"_id": new ObjectID("5e0b00e1c0aa5a17f5ab84ab"), "value": 9, "type": "cash"}],
	"type": "pickup",
	"date": new Date("2021-01-26T09:57:26.930Z"),
	"timeoutDate": new Date("2021-01-26T10:02:26.930Z"),
	"vDate": new Date("2021-01-25T17:00:00.000Z"),
	"bookingNumber": "210126165726930",
	"shippingFee": 0,
	"vSum": 9,
	"vTax": 0.59,
	"vTaxGroups": [{"_id": new ObjectID("600fe788bd5c7e5549974892"), "taxType": 7, "tax": 0.59, "sum": 9}],
	"vDiscount": 1,
	"online": true,
	"note": "",
	"onlineOrderId": "e571c160-5fbc-11eb-a77a-a1ad16df7dd7",
	"discounts": [{
		"_id": new ObjectID("600fe788bd5c7e5549974893"),
		"name": "Giam gia test",
		"value": 1,
		"type": "percent"
	}],
	"deliveryTime": "17:27",
	"user": [{"_id": new ObjectID("5e1d89f200971c2ac29fcccb"), "name": "admin"}],
	"commits": [],
	"declineReason": "",
	"prepareTime": 30
}, {
	"printer": [],
	"_id": new ObjectID("60137196dbf49c517d9ccba9"),
	"id": 4,
	"status": "inProgress",
	"items": [{
		"taxes": [],
		"_id": new ObjectID("60137196dbf49c517d9ccbaa"),
		"originalPrice": 0,
		"id": "1",
		"image": "/cms-files/files/view//images/212 - ov292aq.png",
		"name": "Pepe 1",
		"price": 0,
		"tax": 19,
		"quantity": 1,
		"note": "",
		"modifiers": [{
			"_id": "5ebd12347604c41966d66475",
			"name": "Choice 1 - Nhom 1",
			"price": 2.5,
			"quantity": 1
		}, {"_id": new ObjectID("5ebd0c667604c41966d66435"), "name": "Choice 1 - Nhom 2", "price": 1, "quantity": 1}],
		"groupPrinter": "Kitchen",
		"groupPrinter2": "false",
		"category": "1",
		"attributes": []
	}],
	"customer": {
		"name": "ádf",
		"company": "",
		"phone": "123",
		"address": "",
		"zipCode": "",
		"deliveryTime": "",
		"distance": null
	},
	"deliveryDate": new Date(),
	"payment": [{"_id": new ObjectID("60137196dbf49c517d9ccbad"), "type": "cash", "value": 3.5}],
	"type": "pickup",
	"date": new Date(),
	"timeoutDate": genDateInFuture(new Date(), 300),
	"vDate": new Date("2021-01-28T17:00:00.000Z"),
	"bookingNumber": "210129092315825",
	"shippingFee": 0,
	"vSum": 3.5,
	"vTax": 0,
	"vTaxGroups": [{"_id": new ObjectID("60137196dbf49c517d9ccbae"), "taxType": 19, "tax": 0, "sum": 0}],
	"vDiscount": 0,
	"online": true,
	"note": "",
	"onlineOrderId": "f1f9eb10-61d8-11eb-a77a-a1ad16df7dd7",
	"discounts": [],
	"deliveryTime": "asap",
	"user": [],
	"commits": []
}, {
	"printer": [],
	"_id": new ObjectID("601371a6dbf49c517d9ccbcb"),
	"id": 5,
	"status": "inProgress",
	"items": [{
		"taxes": [],
		"_id": new ObjectID("601371a6dbf49c517d9ccbcc"),
		"id": "3",
		"image": "/cms-files/files/view/Restaurant%20Plus%20images/75ABE9D7-3244-494D-BDF3-F6E3EED92699.png",
		"name": "mon test",
		"desc": "In publishing and graphic design, Lorem ipsum is a placeholder text commonly used to demonstrate the visual form of a document or a typeface without relying on meaningful content. ",
		"price": 0.1,
		"tax": 7,
		"quantity": 1,
		"modifiers": [],
		"groupPrinter": "Kitchen",
		"groupPrinter2": "false",
		"category": "1",
		"originalPrice": 0.1,
		"attributes": []
	}],
	"customer": {
		"name": "dfd",
		"company": "",
		"phone": "123",
		"address": "",
		"zipCode": "",
		"deliveryTime": "",
		"distance": null
	},
	"deliveryDate": genDateInFuture(new Date(), -100),
	"payment": [{"_id": new ObjectID("601371a6dbf49c517d9ccbcd"), "type": "cash", "value": 0.1}],
	"type": "pickup",
	"date": genDateInFuture(new Date(), -100),
	"timeoutDate": genDateInFuture(new Date, 200),
	"vDate": new Date("2021-01-28T17:00:00.000Z"),
	"bookingNumber": "210129092331991",
	"shippingFee": 0,
	"vSum": 0.1,
	"vTax": 0.01,
	"vTaxGroups": [{"_id": new ObjectID("601371a6dbf49c517d9ccbce"), "taxType": 7, "tax": 0.01, "sum": 0.1}],
	"vDiscount": 0,
	"online": true,
	"note": "",
	"onlineOrderId": "fb9c8060-61d8-11eb-a77a-a1ad16df7dd7",
	"discounts": [],
	"deliveryTime": "asap",
	"user": [],
	"commits": []
}]

module.exports = {
	orders
}
