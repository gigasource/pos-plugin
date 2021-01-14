import Hooks from 'schemahandler/hooks/hooks'
import { PortalTarget } from 'portal-vue/dist/portal-vue.esm'
import {activeScreen} from './DashboardSharedStates';
import { onMounted } from 'vue';
import {fetchRooms} from '../View/EditTablePlan/room-state';
import {appHooks} from '../AppSharedStates'
import PosDashboardSidebar from './DashboardSidebar/PosDashboardSidebar2';
import EditableRoom from '../TablePlan/EditableRoom/EditableRoom';
import RestaurantRoom from '../TablePlan/BasicRoom/RestaurantRoom';
import { objectsInSelectingRoom } from '../View/EditTablePlan/room-state';
import EditTablePlanSidebar from '../View/EditTablePlan/EditTablePlanSidebar';
import { getScopeAttrs } from '../../utils/helpers';
import {DashboardSidebarItemsFactory} from './DashboardSidebar/DashboardSidebarItems'
const DashboardFactory = () => {
  const hooks = new Hooks()
  const fn = () => ({
    name: 'Dashboard',
    components: [RestaurantRoom, EditableRoom, PosDashboardSidebar, PortalTarget],
    setup() {
      onMounted(async() => {
        await fetchRooms()
        await appHooks.emit('orderChange')
        activeScreen.value = 'restaurant-room'
      })

      const { refactoredDashboardSidebarItems} = DashboardSidebarItemsFactory()
      const sidebarPortal = () => <portal to="sidebar">
        <PosDashboardSidebar
          items={refactoredDashboardSidebarItems.value}
          {...getScopeAttrs()}>
        </PosDashboardSidebar>
      </portal>

      const activeScreenPortal = () => <portal to = "restaurant-room">
        <RestaurantRoom roomObjects={objectsInSelectingRoom.value} {...getScopeAttrs()}> </RestaurantRoom>
      </portal>
      const editTablePlan = () => <portal to = "edit-table-plan">
        <EditableRoom roomObjects={objectsInSelectingRoom.value} {...getScopeAttrs()}> </EditableRoom>
      </portal>
      const sidebarTargetPortal = () => <portal-target name="sidebar"> </portal-target>
      const activeScreenTargetPortal = () => <portal-target name={activeScreen.value}> </portal-target>
      const renderFn = () =>
        <div class="row-flex">
        {sidebarPortal()}
        {activeScreenPortal()}
        {editTablePlan()}
        {sidebarTargetPortal()}
        {activeScreenTargetPortal()}
       </div>
      return renderFn
    }
  })
  return {hooks, fn}
}

export default DashboardFactory

