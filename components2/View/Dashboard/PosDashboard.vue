
<script>
  import RestaurantRoom from "../../TablePlan/BasicRoom/RestaurantRoom";
  import EditableRoom from "../../TablePlan/EditableRoom/EditableRoom";
  import PosDashboardSidebar from "./DashboardSidebar/PosDashboardSidebar2";
  import {onMounted} from "vue";
  import {fetchRooms} from "../../TablePlan/RoomState";
  import {appHooks} from "../../AppSharedStates";
  import {activeScreen} from "./DashboardSharedStates";
  import DashboardSidebarItemsFactory from "./DashboardSidebar/DashboardSidebarItems";
  import {getScopeAttrs} from "../../../utils/helpers";
  import { PortalTarget } from 'portal-vue/dist/portal-vue.esm'

  export default {
    name: 'Dashboard',
    components: [RestaurantRoom, EditableRoom, PosDashboardSidebar, PortalTarget],
    setup() {
      onMounted(async() => {
        await fetchRooms()
        // todo: should not exit orderChange here
        await appHooks.emit('orderChange')
        activeScreen.value = 'restaurant-room'
      })

      const { refactoredDashboardSidebarItems} = DashboardSidebarItemsFactory()
      const sidebarPortal = () => <portal to="sidebar">
        <pos-dashboard-sidebar
            items={refactoredDashboardSidebarItems.value}
            {...getScopeAttrs()}>
        </pos-dashboard-sidebar>
      </portal>

      const activeScreenPortal = () => <portal to="restaurant-room">
        <restaurant-room {...getScopeAttrs()}> </restaurant-room>
      </portal>
      const editTablePlan = () => <portal to="edit-table-plan">
        <editable-room {...getScopeAttrs()}> </editable-room>
      </portal>
      const sidebarTargetPortal = () => <portal-target name="sidebar"> </portal-target>
      const activeScreenTargetPortal = () => <portal-target name={activeScreen.value}> </portal-target>
      return () =>
          <div class="row-flex">
            {sidebarPortal()}
            {activeScreenPortal()}
            {editTablePlan()}
            {sidebarTargetPortal()}
            {activeScreenTargetPortal()}
          </div>
    }
  }
</script>

<style scoped>

</style>
