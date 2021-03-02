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

export const paymentIcon = ref({})
export const timeoutProgress = ref({})
export const kitchenOrders = ref([])
export const sortedKitchenOrders = computed(() => {
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

/**
 * Single paypal payment transaction can be divided into multiple transactions (capture)
 * For example paypal wallet doesn't have enough money so other payments from card will be use.
 * For this payment, 2 transactions will be executed.
 *
 * @param captureResponses
 * @return {{final_capture}|any}
 */
function getFinalTransaction(captureResponses) {
	let finalCapture;
	for(let purchase_unit of captureResponses.purchase_units) {
		for (let capture of purchase_unit.payments.captures) {
			if (capture.final_capture) {
				finalCapture = capture
				break;
			}
		}
	}
	return finalCapture
}


function isRefundExpired(captureResponses) {
	let refundExpired = true
	const finalTransaction = getFinalTransaction(captureResponses)
	if (finalTransaction) {
		const transactionTime = dayjs(finalTransaction.create_time)
		const refundableTime = dayjs().subtract(3, 'hour')
		refundExpired = transactionTime.isBefore(refundableTime)
	}
	return refundExpired
}

function isRefundFailed(refundResponses) {
	return _.some(refundResponses, r => r.status !== "COMPLETED")
}

export function isRefundable(order) {
	const paypalTransaction = order.paypalOrderDetail
	return (paypalTransaction
			&& paypalTransaction.captureResponses
			&& paypalTransaction.captureResponses.status === "COMPLETED"
			&& !isRefundExpired(paypalTransaction.captureResponses)
			&& (!paypalTransaction.refundResponses || isRefundFailed(paypalTransaction.refundResponses)))
}
//</editor-fold>
