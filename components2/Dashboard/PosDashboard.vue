<script>
import RestaurantRoom from '../TablePlan/BasicRoom/RestaurantRoom';
import EditableRoom from '../TablePlan/EditableRoom/EditableRoom';
import PosDashboardSidebar from './DashboardSidebar/PosDashboardSidebar2';
import OnlineOrderMain from '../OnlineOrder/OnlineOrderMain';
import OnlineOrderList from '../OnlineOrder/OnlineOrderList'
import { computed, h, KeepAlive, ref } from 'vue';
import { fetchRooms, roomsStates } from '../TablePlan/RoomState';
import { appHooks } from '../AppSharedStates';
import { activeScreen, selectingRoomId } from './DashboardSharedStates';
import DashboardSidebarFactory from './DashboardSidebar/DashboardSidebarItems';
import PosOrderManualTable from '../TablePlan/BasicRoom/ManualTable/PosOrderManualTable';
import PosDashboardFunction from './DashboardFunctions/PosDashboardFunction';
import VirtualPrinterView from '../../components/VirtualPrinter/VirtualPrinterView';

export default {
  name: 'Dashboard',
  components: {
    VirtualPrinterView,
    OnlineOrderList,
    OnlineOrderMain, PosDashboardFunction, RestaurantRoom, EditableRoom, PosDashboardSidebar, PosOrderManualTable
  },
  setup() {
    fetchRooms().then(() => {
      //auto select first room
      roomsStates.value.length && (selectingRoomId.value = roomsStates.value[0].room._id.toString())
    })

    appHooks.emit('orderChange')
    const { sidebarItems } = DashboardSidebarFactory()
    const sidebarSelectingPath = ref('')
    sidebarItems.value.forEach((item, idx) => {
      if (item.feature === 'functions') {
        sidebarSelectingPath.value = `items.${idx}`
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
    const ManualTableView = () => <PosOrderManualTable> </PosOrderManualTable>
    const FunctionsView = () => <PosDashboardFunction></PosDashboardFunction>
    const OnlineOrderMainView = <OnlineOrderMain></OnlineOrderMain>
    const OnlineOrderListDeclinedView = <OnlineOrderList status="declined"></OnlineOrderList>
    const OnlineOrderListCompletedView = <OnlineOrderList status="completed"></OnlineOrderList>
    const VirtualPrinter = <VirtualPrinterView></VirtualPrinterView>
    const DashBoardViews = {
      KeptAliveRoomViews,
      ManualTableView,
      FunctionsView,
      OnlineOrderMainView,
      OnlineOrderListDeclinedView,
      OnlineOrderListCompletedView,
      VirtualPrinter
    };

    return () =>
        <div class="row-flex">
          {sidebarRender()}
          <KeepAlive>
            {h(DashBoardViews[activeScreen.value])}
          </KeepAlive>
        </div>
  }
}
</script>

<style scoped>

</style>
