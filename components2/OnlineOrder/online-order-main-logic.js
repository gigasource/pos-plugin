import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'

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
	return kitchenOrders.value
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
				// this.$emit('getPendingOnlineOrderCounter')
				return timeoutProgress.value[order._id] = { progress: 0, remaining: 0 }
			}

			const x = (timeout - diff) / timeout
			const progress = 100 * (1 - Math.sin((x * Math.PI) / 2))

			order.timeoutProgress = progress
			timeoutProgress.value[order._id] = { progress, remaining: diff.toFixed(0) }
			timeoutInterval.value[order._id] = setTimeout(calTimeout, 250)
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
//</editor-fold>
