import Hooks from 'schemahandler/hooks/hooks'
import { PortalTarget } from 'portal-vue/dist/portal-vue.esm'
import {activeScreen} from './DashboardSharedStates';
import { getCurrentInstance, onMounted, withScopeId } from 'vue';
import {fetchRooms} from '../View/EditTablePlan/room-state';
import {appHooks} from '../AppSharedStates'
import PosDashboardSidebar from './DashboardSidebar/PosDashboardSidebar2';
import { objectsInSelectingRoom } from '../View/EditTablePlan/room-state';
import Room from './../TablePlan/Room_new';
import { getScopeId } from '../../utils/helpers';

const DashboardFactory = () => {
  const hooks = new Hooks()
  const fn = () => ({
    name: 'Dashboard',
    components: [PosDashboardSidebar, PortalTarget, Room],
    setup() {

      const { type} = getCurrentInstance()
      const scopeId = type.__scopeId
      const attrs = {
        ...scopeId ? { [scopeId]: '' } : {}
      }
      onMounted(async() => {
        await fetchRooms()
        await appHooks.emit('orderChange')
        activeScreen.value = 'active-screen'
      })
      const sidebarPortal = () => <portal to="sidebar">
        <PosDashboardSidebar>
        </PosDashboardSidebar>
      </portal>

      const activeScreenPortal = (attrs) => <portal to = "restaurant-room">
        <Room roomObjects={objectsInSelectingRoom.value} {...attrs}> </Room>
      </portal>
      const sidebarTargetPortal = () => <portal-target name="sidebar"> </portal-target>
      const activeScreenTargetPortal = () => <portal-target name={activeScreen.value}> </portal-target>
      const renderFn = () =>
        <div class="row-flex">
        {sidebarPortal()}
        {activeScreenPortal()}
        {sidebarTargetPortal()}
        {activeScreenTargetPortal()}
       </div>
      return () => withScopeId(getScopeId())(renderFn)()
    }
  })
  return {hooks, fn}
}

export default DashboardFactory

