import Hooks from 'schemahandler/hooks/hooks'
import EditableRoom from './EditableRoom/EditableRoom';
import EditTablePlanSidebar from './EditTablePlanSidebar';
import { fetchRooms, onSelectRoom, roomsStates, selectingRoomStates } from '../TablePlan/RoomState';
import dialogTextFilter from '../pos-shared-components/dialogFilter/dialogTextFilter';
import GSnackbar from '../../../../backoffice/pos-vue-framework/src/components/GSnackbar/GSnackbar';
import { genScopeId } from '../utils';
import {
  dialog,
  initI18n,
  isSelectingARoom,
  isSelectingARoomObject,
  onUpdateSelectingRoomName,
  selectingObject,
  showExistedTableNameError,
  tableNameExistedErrorMsg,
  updateTableName
} from './EditableRoom/EditTablePlanLogics';

const EditablePlanFactory = () => {
  const hooks = new Hooks()
  const fn = () => ({
    name: 'EditTablePlan',
    components: [EditTablePlanSidebar, EditableRoom, dialogTextFilter, GSnackbar],
    setup() {
      initI18n()
      fetchRooms().then(() => {
        roomsStates.value.length > 0 && onSelectRoom(roomsStates.value[0])
      })
      const sidebarRenderFn = () => <EditTablePlanSidebar/>
      const roomRenderFn = () => <EditableRoom/>
      const dialogsRenderFn = () => <>
        {isSelectingARoom.value &&
        <dialog-text-filter label="Room name" default-value={selectingRoomStates.value.room.name} v-model={dialog.showRoomNameKbd} onSubmit={onUpdateSelectingRoomName}/>}
        {isSelectingARoomObject.value &&
        <dialog-text-filter label="Table name" default-value={selectingObject.value.name} v-model={dialog.showTableNameKbd} onSubmit={updateTableName}/>}
        <g-snackbar v-model={showExistedTableNameError.value} time-out="3000">{tableNameExistedErrorMsg.value}</g-snackbar>
      </>
      return genScopeId(() => <div class="row-flex">
        {sidebarRenderFn()}
        {roomRenderFn()}
        {dialogsRenderFn()}
      </div>)
    }
  })
  return {
    fn,
    hooks
  }
}

export default EditablePlanFactory
