import Hooks from 'schemahandler/hooks/hooks'
import EditableRoom from '../../TablePlan/EditableRoom/EditableRoom';
import EditTablePlanSidebar from './EditTablePlanSidebar';
import { onBeforeMount } from 'vue';
import { fetchRooms } from '../../TablePlan/RoomState';
import { getScopeAttrs } from '../../../utils/helpers';
import dialogTextFilter from '../../../components/pos-shared-components/dialogFilter/dialogTextFilter';
import GSnackbar from '../../../../../backoffice/pos-vue-framework/src/components/GSnackbar/GSnackbar';

const EditablePlanFactory = () => {
  const hooks = new Hooks()
  const fn = () => ({
    name: 'EditTablePlan',
    components: [EditTablePlanSidebar, EditableRoom, dialogTextFilter, GSnackbar],
    setup() {
      const sidebarRenderFn = () => <EditTablePlanSidebar {...getScopeAttrs()} >
      </EditTablePlanSidebar>
      const roomRenderFn = () =>
        <EditableRoom {...getScopeAttrs()}> </EditableRoom>

      // const dialogsRenderFn = () => <>
      // {isSelectingARoom.value  ? <dialog-text-filter label="Room name" default-value={selectingRoom.value.name} v-model={dialog.value.showRoomNameKbd} onSubmit={onUpdateSelectingRoomName}/> : null}
      //   {isSelectingARoomObject.value  ? <dialog-text-filter label="Table name" default-value={selectingObject.value.name} v-model={dialog.value.showTableNameKbd} onSubmit={onUpdateTableName}/> : null}
      // <g-snackbar v-model={showSnackBar.value} time-out="3000">{ tableNameExistedErrorMsg }</g-snackbar>
      // </>
      onBeforeMount(async () => {
        await fetchRooms()
      })
      return () => <div class="row-flex">
        {sidebarRenderFn()}
        {roomRenderFn()}
      </div>
    }
  })
  return {
    fn,
    hooks
  }
}

export default EditablePlanFactory
