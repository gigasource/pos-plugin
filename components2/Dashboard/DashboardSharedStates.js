import { ref } from 'vue';
import Hooks from 'schemahandler/hooks/hooks'
import { listOnlineOrderStatus } from '../OnlineOrder/online-order-list-render'

export const DASHBOARD_VIEWS = {
  KEPT_ALIVE_ROOM_VIEW: 'KEPT_ALIVE_ROOM_VIEW',
  MANUAL_TABLE_VIEW: 'MANUAL_TABLE_VIEW',
  FUNCTIONS_VIEW: 'FUNCTIONS_VIEW',
  ONLINE_ORDER_MAIN_VIEW:'ONLINE_ORDER_MAIN_VIEW',
  ONLINE_ORDER_LIST_DECLINED_VIEW:'ONLINE_ORDER_LIST_DECLINED_VIEW',
  ONLINE_ORDER_LIST_COMPETED_VIEW:'ONLINE_ORDER_LIST_COMPETED_VIEW',
  ONLINE_ORDER_SERVICE_VIEW: 'ONLINE_ORDER_SERVICE_VIEW',
  RESERVATION_VIEW:'RESERVATION_VIEW',
  VIRTUAL_PRINTER:'VIRTUAL_PRINTER',
  DASHBOARD_VIEWS:'DASHBOARD_VIEWS'
}
export const dashboardHooks = new Hooks()
export const activeScreen = ref(DASHBOARD_VIEWS.FUNCTIONS_VIEW)
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
