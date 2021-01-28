import { computed, ref } from 'vue'
import { inventoryCategories } from '../inventory-logic-ui'

export const showKeyboard = ref(false)
export const addedCategory = ref([])
export const rules = computed(() => {
	let rules = []
	rules.push(val => inventoryCategories.value.filter(cate => cate === val).length <= 1 || '')
	return rules
})
