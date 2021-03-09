<script>
import { computed, h, KeepAlive, ref } from 'vue'
import { appHooks } from '../AppSharedStates'
import { fetchRooms, roomsStates } from '../TablePlan/RoomState'
import { activeScreen, selectingRoomId } from './DashboardSharedStates'
import DashboardSidebarFactory from './DashboardSidebar/DashboardSidebarItems'
import RestaurantRoom from '../TablePlan/BasicRoom/RestaurantRoom'
import EditableRoom from '../EditTablePlan/EditableRoom/EditableRoom'
import PosDashboardSidebar from './DashboardSidebar/PosDashboardSidebar2'
import OnlineOrderMain from '../OnlineOrder/OnlineOrderMain'
import OnlineOrderList from '../OnlineOrder/OnlineOrderList'
import OnlineOrderServices from '../OnlineOrder/OnlineOrderServices';
import { computed, h, KeepAlive, onActivated, ref } from 'vue';
import { fetchRooms, roomsStates } from '../TablePlan/RoomState';
import { appHooks } from '../AppSharedStates';
import { activeScreen, DASHBOARD_VIEWS, selectingRoomId } from './DashboardSharedStates';
import DashboardSidebarFactory from './DashboardSidebar/DashboardSidebarItems';
import PosOrderManualTable from '../TablePlan/BasicRoom/ManualTable/PosOrderManualTable';
import PosDashboardFunction from './DashboardFunctions/PosDashboardFunction';
import VirtualPrinterView from '../VirtualPrinter/VirtualPrinterView';
import ReservationsList from '../Reservation/ReservationsList';
import { VIEWS } from '../Settings/settings-shared';

import OnlineOrderServices from '../OnlineOrder/OnlineOrderServices'
import PosOrderManualTable from '../TablePlan/BasicRoom/ManualTable/PosOrderManualTable'
import PosDashboardFunction from './DashboardFunctions/PosDashboardFunction'
import VirtualPrinterView from '../VirtualPrinter/VirtualPrinterView'
import ReservationsList from '../Reservation/ReservationsList'

export default {
  name: 'Dashboard',
  components: {
    VirtualPrinterView,
    OnlineOrderList, OnlineOrderMain, OnlineOrderServices,
    PosDashboardFunction, RestaurantRoom, EditableRoom, PosDashboardSidebar, PosOrderManualTable,
    ReservationsList
  },
  setup() {
    fetchRooms().then(() => {
      //auto select first room
      // roomsStates.value.length && (selectingRoomId.value = roomsStates.value[0].room._id.toString())
    })

    appHooks.emit('orderChange')
    const { sidebarItems } = DashboardSidebarFactory()
    const sidebarSelectingPath = ref('')
    onActivated(() => {
      if (activeScreen.value === DASHBOARD_VIEWS.FUNCTIONS_VIEW) {
        sidebarItems.value.forEach((item, idx) => {
          if (item.feature === 'functions') {
            sidebarSelectingPath.value = `items.${idx}`
          }
        })
      }
    })
    const sidebarRender = () => <pos-dashboard-sidebar v-model={sidebarSelectingPath.value} items={sidebarItems.value}/>

    const RoomsViews = computed(() => {
      const views = {};
      roomsStates.value.forEach((roomState) => {
        // should provide key for keep-alive
        views[roomState.room._id.toString()] =
            <RestaurantRoom key={roomState.room._id} roomId={roomState.room._id.toString()}/>
      });
      return views
    })
    const KeptAliveRoomViews = {
      name: 'KeptAliveRoomViews',
      setup() {
        return () => selectingRoomId.value &&
            <KeepAlive>
              {h(RoomsViews.value[selectingRoomId.value])}
            </KeepAlive>
      }
    };
    const ManualTableView = <PosOrderManualTable key="manualTableView"/>
    const FunctionsView = <PosDashboardFunction key="FunctionsView"/>
    const OnlineOrderMainView = <OnlineOrderMain key="OnlineOrderMainView"/>
    const OnlineOrderListDeclinedView = <OnlineOrderList status="declined" key="OnlineOrderListDeclinedView"/>
    const OnlineOrderListCompletedView = <OnlineOrderList status="completed" key="OnlineOrderListCompletedView"/>
    const OnlineOrderServicesView = <OnlineOrderServices key="OnlineOrderServicesView"/>
    const ReservationView = <ReservationsList key="ReservationView"/>
    const VirtualPrinter = <VirtualPrinterView key="VirtualPrinter"/>
    let DashBoardViews = {}
    DashBoardViews[DASHBOARD_VIEWS.KEPT_ALIVE_ROOM_VIEW] = KeptAliveRoomViews
    DashBoardViews[DASHBOARD_VIEWS.MANUAL_TABLE_VIEW] = ManualTableView
    DashBoardViews[DASHBOARD_VIEWS.FUNCTIONS_VIEW] = FunctionsView
    DashBoardViews[DASHBOARD_VIEWS.ONLINE_ORDER_MAIN_VIEW] = OnlineOrderMainView
    DashBoardViews[DASHBOARD_VIEWS.ONLINE_ORDER_LIST_DECLINED_VIEW] = OnlineOrderListDeclinedView
    DashBoardViews[DASHBOARD_VIEWS.ONLINE_ORDER_LIST_COMPETED_VIEW] = OnlineOrderListCompletedView
    DashBoardViews[DASHBOARD_VIEWS.ONLINE_ORDER_SERVICE_VIEW] = OnlineOrderServicesView
    DashBoardViews[DASHBOARD_VIEWS.RESERVATION_VIEW] = ReservationView
    DashBoardViews[DASHBOARD_VIEWS.VIRTUAL_PRINTER] = VirtualPrinter

    return () =>
        <div class="row-flex" style="max-height: 100%">
          {sidebarRender()}
          <KeepAlive>
            {h(DashBoardViews[activeScreen.value])}
          </KeepAlive>
        </div>
  }
}
</script>
