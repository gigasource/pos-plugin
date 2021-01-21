
<script>
  import RestaurantRoom2 from "../../TablePlan/BasicRoom/RestaurantRoom2";
  import EditableRoom from "../../TablePlan/EditableRoom/EditableRoom";
  import PosDashboardSidebar from "./DashboardSidebar/PosDashboardSidebar2";
  import { onBeforeMount, onMounted, ref } from 'vue';
  import {fetchRooms, roomsStates} from "../../TablePlan/RoomState";
  import {appHooks} from "../../AppSharedStates";
  import {activeScreen} from "./DashboardSharedStates";
  import DashboardSidebarItemsFactory from "./DashboardSidebar/DashboardSidebarItems";
  import {getScopeAttrs} from "../../../utils/helpers";
  import { PortalTarget } from 'portal-vue/dist/portal-vue.esm'
  import { selectingRoomId } from './DashboardSharedStates';


  export default {
    name: 'Dashboard',
    components: [RestaurantRoom2, EditableRoom, PosDashboardSidebar, PortalTarget],
    setup() {
      onBeforeMount(async() => {
        await fetchRooms()
        // todo: should not exit orderChange here
        activeScreen.value = 'restaurant-room'
        await appHooks.emit('orderChange')
      })

      const { refactoredDashboardSidebarItems} = DashboardSidebarItemsFactory()
      const sidebarPortal = () =>
        <pos-dashboard-sidebar
            items={refactoredDashboardSidebarItems.value}
            {...getScopeAttrs()}>
        </pos-dashboard-sidebar>

      const activeScreenPortal = () => <portal-target name="restaurant-room">
        <restaurant-room2  roomId={selectingRoomId.value} {...getScopeAttrs()}> </restaurant-room2>
      </portal-target>
      // const editTablePlan = () => <portal to="edit-table-plan">
      //   <editable-room {...getScopeAttrs()}> </editable-room>
      // </portal>
      const sidebarTargetPortal = () => <portal-target name="sidebar"> </portal-target>
      const activeScreenTargetPortal = () => <portal-target name={activeScreen.value}> </portal-target>
      return () =>
          <div class="row-flex">
            {sidebarPortal()}
            {activeScreenPortal()}
            {sidebarTargetPortal()}
            {activeScreenTargetPortal()}
          </div>
    }
  }
</script>

<style scoped>

</style>
