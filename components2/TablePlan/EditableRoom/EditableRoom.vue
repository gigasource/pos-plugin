<script>
import RoomUI from '../RoomUI'
import { computed } from 'vue'
import EditableRoomEventHandlersFactory from './EventHandlersForEditableRoom'
import { isSelectingObject } from '../../View/EditTablePlan/EditTablePlanLogics';
import { getScopeAttrs } from '../../../utils/helpers';
import RoomStyleFactory from '../RoomStyles';
import { isTable } from '../RoomLogics';
import { selectingRoomStates } from '../RoomState';

const { roomObjectContainerStyle, roomObjectStyle } = RoomStyleFactory()

const { resizeRoomObjectEvenHandler, touchHandlers } = EditableRoomEventHandlersFactory()


const _roomObjectContainerStyle = (obj) => {
  const style = roomObjectContainerStyle(obj)
  if (isSelectingObject(obj)) {
    style.border = '1px solid #1271FF'
    style.zIndex = 50
  }
  return style
}

const objectRenderFn = (obj) => <div style={roomObjectStyle(obj)}>

  {isTable(obj) ? obj.name : ''}
</div>

const style = computed(() => ({
  width: `${(selectingRoomStates.value ? selectingRoomStates.value.zoom : 1) * 20}px`,
  height: `${(selectingRoomStates.value ? selectingRoomStates.value.zoom : 1) * 20}px`,
  'border-radius': '100%',
  'background-color': '#2979FF',
  position: 'absolute',
  right: 0,
  bottom: 0,
  transform: `translate(100%, 100%)`,
  display: 'flex',
  'justify-content': 'center',
  'align-items': 'center',
  zIndex: 100
}))

const arrowStyle = computed(() => ({
  width: `${13 * selectingRoomStates.value.zoom}px`,
  height: `${13 * selectingRoomStates.value.zoom}px`,
}))

const resizeButtonRenderFn = obj => isSelectingObject(obj) &&
    <div style={style.value} {...getScopeAttrs()}
         {...resizeRoomObjectEvenHandler(obj)}
    >
      <img alt style={arrowStyle.value} src="/plugins/pos-plugin/assets/resize.svg" draggable="false"/>
    </div>

const roomObjectRenderFn = (obj) => {
  return <div key={obj._id} id={obj.name}
              v-touch={touchHandlers(obj)}
              style={_roomObjectContainerStyle(obj)}
  >
    {objectRenderFn(obj)}
    {resizeButtonRenderFn(obj, getScopeAttrs())}
  </div>
}
const { hooks, fn } = RoomUI({roomObjectRenderFn})
export default fn()
</script>
<style scoped lang="scss">
.room {
  position: relative;
  width: 100%;
  height: 100%;
  background-image: url('/plugins/pos-plugin/assets/out.png');

  &__object__rotate {
    width: 16px;
    height: 16px;
    border-radius: 100%;
    background-color: #2979FF;
    position: absolute;
    right: 0;
    bottom: 0;
    transform: translateX(100%);
    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
