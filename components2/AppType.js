import { ref } from 'vue'

export const appType = {
	POS_RESTAURANT: 'POS_RESTAURANT',
	POS_RETAIL: 'POS_RETAIL'
}
export const currentAppType = ref(appType.POS_RESTAURANT)
