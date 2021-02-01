import { ref } from 'vue';
import Hooks from 'schemahandler/hooks/hooks'

export const dashboardHooks = new Hooks()
export const activeScreen = ref('KeptAliveRoomViews')
export const enabledFeatures = ref([])

export const selectingRoomId = ref('')
dashboardHooks.on('updateScreen', function (val) {
  activeScreen.value = val
})

dashboardHooks.on('selectRoom', function(val) {
  selectingRoomId.value = val

})
