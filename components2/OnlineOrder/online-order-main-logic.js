const { ref, computed } = require('vue')

export const internalOrders = ref([])
export const modemDeviceConnected = ref(null)
export const calls = ref([])
export const missedCalls = ref([])
export const paymentIcon = ref({})
export const timeoutProgress = ref({})
export const kitchenOrders = ref([])
export const sortedKitchenOrders = computed(() => {
	//todo: fill this
	return kitchenOrders
})
export const dialogRef = ref({})

export function submitReason(reason) {

}
