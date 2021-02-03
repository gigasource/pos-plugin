import { ref } from 'vue';
import Hooks from 'schemahandler/hooks/hooks'
import { listOnlineOrderStatus } from '../OnlineOrder/online-order-list-render'

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

dashboardHooks.on('changeOnlineOrderListStatus', function (val) {
  listOnlineOrderStatus.value = val
})
