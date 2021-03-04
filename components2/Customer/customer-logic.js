import { ref, computed } from 'vue'

export const customers = ref([])

export const customerNames = computed(() => {
	return customers.value.map(customer => customer.name)
})


