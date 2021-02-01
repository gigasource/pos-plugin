import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import _ from 'lodash'

export const hooks = new (require('schemahandler/hooks/hooks'))();

const timeoutInterval = {}

export const pendingOrders = ref([])

watch(() => pendingOrders.value, (val, preVal) => {
	if (val === preVal) return
	for (let order of pendingOrders.value) {
		Object.assign(order, {
			...order.deliveryTime ? { delivery: order.deliveryTime.toString() } : {},
			shippingFee: getShippingFee(order),
			payment: order.payment,
			confirmStep2: false,
			declineStep2: false,
			prepareTime: null,
			declineReason: ''
		})
	}

	timeoutProgress.value = {}
	Object.keys(timeoutInterval).forEach(orderId => {
		clearTimeout(timeoutInterval[orderId])
	})
	pendingOrders.value.map((order) => {
			getTimeoutProgress(order)
	})
})

export const modemDeviceConnected = ref(null)
export const calls = ref([])
export const missedCalls = ref([])
export const paymentIcon = ref({})
export const timeoutProgress = ref({})
export const kitchenOrders = ref([])
export const sortedKitchenOrders = computed(() => {
	//todo: fill this
	return kitchenOrders.value.sort((orderA, orderB) => {
		return getPendingOrderKitchenTime(orderA) - getPendingOrderKitchenTime(orderB)
	})
})
export const dialogRef = ref({})
export const defaultPrepareTime = ref(15)

//<editor-fold desc="function">
export function submitReason(reason) {

}

export function getPendingOrderKitchenTime(order) {
	return dayjs(order.deliveryTime, 'HH:mm').diff(dayjs(), 'minute')
}

export function getExtraInfo(item) {
	let extrasArr = []
	if (item.modifiers && item.modifiers.length) extrasArr.push(...item.modifiers.map(m => m.name))
	if (item.note) extrasArr.push(item.note)
	return extrasArr.length ? `(${extrasArr.join(', ')})` : ''
}

export function getShippingFee(order) {
	if (!order.discounts) return order.shippingFee

	const freeShipping = order.discounts.find(item => item.type === 'freeShipping');
	return freeShipping ? freeShipping.value : order.shippingFee;
}

export function getTimeoutProgress(order) {
	const calTimeout = () => {
		clearTimeout(timeoutInterval[order._id])
		requestAnimationFrame(() => {
			const now = new Date()
			const diff = dayjs(order.timeoutDate).diff(now, 'second', true);
			const timeout = dayjs(order.timeoutDate).diff(order.date, 'second', true)
			if (diff <= 0){
				delete timeoutProgress.value[order._id]
				_.remove(pendingOrders.value, _order => _order._id.toString() === order._id.toString())
				hooks.emit('timeoutOrder', order._id)
				return
			}

			const x = (timeout - diff) / timeout
			const progress = 100 * (1 - Math.sin((x * Math.PI) / 2))

			order.timeoutProgress = progress
			timeoutProgress.value[order._id] = { progress, remaining: diff.toFixed(0) }
			timeoutInterval[order._id] = setTimeout(calTimeout, 250)
		})
	}

	if (!order.timeoutDate) return
	return calTimeout()
}

export function getItemPrice(item) {
	let price = item.originalPrice || item.price
	if (item.modifiers && item.modifiers.length > 0) {
		price += _.sumBy(item.modifiers, m => m.price * m.quantity)
	}
	return price
}

export function isPrepaidOrder(order) {
	return order.paypalOrderDetail && order.paypalOrderDetail.orderID != null // paypal
}

export function isRefunded(order) {
	return (order.paypalOrderDetail
		&& order.paypalOrderDetail.refundResponses
		&& _.every(order.paypalOrderDetail.refundResponses, r => r.status === "COMPLETED"))
}

export function isRefundable(order) {
	// refundable order is order paid via paypal and money has been captured
	// and not refund yet or refund but some capture failed
	return (order.paypalOrderDetail
		&& order.paypalOrderDetail.captureResponses
		&& order.paypalOrderDetail.captureResponses.status === "COMPLETED" && !this.isCaptureRefundExpired(order.paypalOrderDetail.captureResponses)
		&& (!order.paypalOrderDetail.refundResponses || this.isRefundFailed(order.paypalOrderDetail.refundResponses)))
}
//</editor-fold>
