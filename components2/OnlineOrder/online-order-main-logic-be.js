import {
	calls, kitchenOrders,
	pendingOrders,
	missedCalls,
	paymentIcon
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


