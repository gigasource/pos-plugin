import { ref, computed } from 'vue'

export const customers = ref([])

export const customerNames = computed(() => {
	return customers.value.map(customer => `${customer.name} - ${customer.phone}`)
})

export function findCustomerWithId(customerId) {
	return customers.value.find(customer => customerId.toString() === customer._id.toString())
}


