import {
	calls, kitchenOrders,
	pendingOrders,
	missedCalls,
	isPrepaidOrder
} from './online-order-main-logic'

const Order = cms.getModel('Order')

export async function getPaymentIcon(payment) {
	const paymentMethod = await cms.getModel('PosSetting').find()
}

export function deleteCall(index, { callId }) {
	calls.value.splice(index, 1)
	cancelMissedCallTimeout()
}

export function deleteMissedCall(index) {
	missedCalls.value.splice(index, 1)
}

export function cancelMissedCallTimeout(callId) {
	// todo: fill this
}

export function completeOrder(order) {
	// todo: fill this
}

export function declineOrder(order) {
	// todo: fill this
}

export async function loadOrders() {
	pendingOrders.value = await Order.find({ online: true, status: 'inProgress' })
	kitchenOrders.value = await Order.find({ online: true, status: 'kitchen' })
}

export async function acceptOrder(order) {
	let deliveryDateTime
	if (order.deliveryTime === 'asap') {
		deliveryDateTime = dayjs().add(order.prepareTime, 'minute')
		order.deliveryTime = deliveryDateTime.format('HH:mm')
	} else {
		deliveryDateTime = dayjs(order.deliveryTime, 'HH:mm')
	}
	const status = 'kitchen'
	let _isPrepaidOrder = isPrepaidOrder(order);

	let updateOrderInfo = Object.assign({}, order, { status, user: this.user });
	let updatedOrder;
	if (isPrepaidOrder) {
		updatedOrder = order
	} else {
		updatedOrder = await cms.getModel('Order').findOneAndUpdate({ _id: order._id }, updateOrderInfo)
		// this.printOnlineOrderKitchen(order._id)
		// this.printOnlineOrderReport(order._id)
		// await this.updateOnlineOrders()
	}

	const orderStatus = {
		orderId: updatedOrder.id,
		onlineOrderId: updatedOrder.onlineOrderId,
		status: status,
		paypalOrderDetail: order.paypalOrderDetail,
		total: order.vSum
	}

	Object.assign(order, orderStatus)

	await Order.findOneAndUpdate({
		_id: order._id
	}, order)
	// todo: update pendingOrders and kitchenOrders
}

