import { ref, computed } from 'vue'
import dayjs from 'dayjs'

export const pendingOrders = ref([])
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
//</editor-fold>
