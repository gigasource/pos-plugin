import {
	calls, kitchenOrders,
	pendingOrders,
	missedCalls,
	isPrepaidOrder,
	hooks
} from './online-order-main-logic'
import {
	user
} from '../AppSharedStates'
import cms from 'cms'

const Order = cms.getModel('Order')

/**
 * Recognize timeout order
 */
hooks.on('timeoutOrder', async function (orderId) {
	await Order.findOneAndUpdate({
		_id: orderId
	}, {
		status: 'declined',
		responseMessage: 'Order timeout'
	})
})

export async function getPaymentMethod(payment) {
	const paymentMethod = await cms.getModel('PosSetting').find()
	return paymentMethod
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

export async function completeOrder(order) {
	if (!order.status === 'kitchen') {
		console.warn('This order is not from kitchen')
		return
	}
	const status = 'completed'
	const orderStatus = {
		orderId: order.id,
		status
	}
	Object.assign(order, orderStatus)
	await Order.findOneAndUpdate({
		_id: order._id
	}, order)
	_.remove(kitchenOrders.value, _order => _order._id.toString() === order._id.toString())
}

export async function declineOrder(order) {
	const status = 'declined'
	const orderStatus = {
		orderId: order.id,
		status,
		responseMessage: order.declineReason
	}
	Object.assign(order, orderStatus)
	await Order.findOneAndUpdate({
		_id: order._id
	}, order)
	_.remove(kitchenOrders.value, _order => _order._id.toString() === order._id.toString())
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

	if (!_isPrepaidOrder) {
		// this.printOnlineOrderKitchen(order._id)
		// this.printOnlineOrderReport(order._id)
		// await this.updateOnlineOrders()
	}

	const orderStatus = {
		status: status,
		user
	}

	Object.assign(order, orderStatus)

	await Order.findOneAndUpdate({
		_id: order._id
	}, order)
	_.remove(pendingOrders.value, _order => _order._id.toString() === order._id.toString())
	kitchenOrders.value.unshift(order)
}

export async function getOnlineOrdersByLimit(page, limit) {
	return await Order.find({ online: true }).sort({ date: -1 }).skip(page * limit).limit(limit)
}

