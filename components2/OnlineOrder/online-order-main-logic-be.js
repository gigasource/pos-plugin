import {
	calls,
	missedCalls,
	paymentIcon
} from './online-order-main-logic'

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



