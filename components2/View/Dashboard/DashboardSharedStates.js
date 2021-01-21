import { ref } from 'vue';
import Hooks from 'schemahandler/hooks/hooks'

export const dashboardHooks = new Hooks()
export const activeScreen = ref('restaurant-room')
export const enabledFeatures = ref([])

export const selectingRoomId = ref('')
hooks.on('updateScreen', function (val) {
  activeScreen.value = val
})
