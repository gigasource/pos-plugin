import { createRoom, updateRoomObjects } from './room-logic'
import {
  isBusyTable,
  getTableOrderInfo,
  onSelectObject,
  isSelectingObject,
  selectingObject, isTable,
} from '../View/EditTablePlan/room-state'
import Hooks from 'schemahandler/hooks/hooks'
import { ref, onMounted, computed, watch, toRaw, Fragment, withScopeId } from 'vue'
import { getDiffTime } from '../../utils/commons';
import { Touch } from 'pos-vue-framework'
import * as mouseEventUtil from '../../utils/mouseEventUtil';

import { getScopeId } from '../../utils/helpers';
import _ from 'lodash'
import { roomContainerStyle, roomObjectStyle, roomObjectContainerStyle } from './RoomStyles';

const RoomFactory = () => {
  const hooks = new Hooks()
  const fn = () => ({
    name: 'Room',
    props: {
      roomObjects: {
        type: Array
      }
    },
    directives: {
      Touch
    },
    components: [Fragment],
    setup(props) {
      const { room, viewW, viewH, zoom, updateObjectLocation, updateObjectSize } = createRoom({ roomObjects: props.roomObjects })
      const action = ref('')
      const curTime = ref(new Date())
      watch(() => props.roomObjects, (newV, oldV) => {
        updateRoomObjects(room, newV)
      }, { deep: true })
      hooks.emit('room', room, e => eval(e))


      const roomContainer = ref(null)
      const PADDING_RIGHT = 100;
      const PADDING_BOTTOM = 30;
      onMounted(() => {
        viewW.value = roomContainer.value.offsetWidth - PADDING_RIGHT
        viewH.value = roomContainer.value.offsetHeight - PADDING_BOTTOM
        setInterval(() => {
          curTime.value = new Date()
        }, 30000)
      })

      const roomObjectRenderFn = (obj) => {
        const isActiveTable = obj.type === 'table' && isBusyTable(obj)
        const tableOrderInfo = getTableOrderInfo(obj)
        return <div style={roomObjectStyle(obj)}>
          {isTable(obj) ? <>
              <div style="font-size: 10px; position: absolute; top: 2px"> $123</div>
              <div>
                <div> {obj.name} </div>
              </div>
              {isActiveTable ?
                <div style="font-size: 10px; position: absolute; bottom: 2px"> {`${getDiffTime(tableOrderInfo.date, curTime.value)} mins`} </div> : null}
            </> : null}
        </div>
      }

      const lastPos = ref({ x: 0, y: 0 })

      const onMouseDown = function (e, roomObject, newAction) {
        action.value = newAction
        mouseEventUtil.normalizeEvent(e)
        lastPos.value = { x: e.clientX, y: e.clientY };
        onSelectObject(roomObject)
      }

      const applyChange = _.throttle(e => {
        if (!selectingObject.value) return
        const change = {
          offsetX: e.clientX - lastPos.value.x,
          offsetY: e.clientY - lastPos.value.y
        }
        if (action.value === 'move') {
          const curPosition = selectingObject.value.realLocation
          updateObjectLocation(selectingObject.value, {
            x: curPosition.x + change.offsetX,
            y: curPosition.y + change.offsetY
          })
        } else {
          const curSize = selectingObject.value.realSize
          updateObjectSize(selectingObject.value, {
            width: curSize.width + change.offsetX,
            height: curSize.height + change.offsetY
          })
        }
        lastPos.value = { x: e.clientX, y: e.clientY }
      }, 16)

      const onMouseMove = function (e) {
        mouseEventUtil.normalizeEvent(e);
        applyChange(e)
      }
      const onMouseUp = function (e) {
        // todo: update db
        action.value = null
      }
      const getTouchHandlers = function (item) {
        return {
          start: e => onMouseDown(e, item, 'move'),
          move: e => onMouseMove(e),
          end: e => onMouseUp(e)
        }
      }

      const roomContainerEventHandler = {
        onMousemove(e) {
          e.preventDefault()
          e.stopPropagation()
          onMouseMove(e)
        },
        onMouseup(e) {
          e.preventDefault()
          e.stopPropagation()
          onMouseUp(e)
        },
        onTouchmove(e) {
          e.preventDefault()
          e.stopPropagation()
          onMouseMove(e)
        },
        onTouchend(e) {
          e.preventDefault()
          e.stopPropagation()
          onMouseUp(e)
        }
      }

      const editRoomObjectEvenHandler = obj => ({
        onMousedown(e) {
          e.preventDefault()
          e.stopPropagation()
          onMouseDown(e, obj, 'edit')
        },
        onTouchstart(e) {
          e.preventDefault()
          e.stopPropagation()
          onMouseDown(e, obj, 'edit')
        }
      })

      const roomRenderFn = () =>
        <div id="room" class={['room']} ref={roomContainer} style={roomContainerStyle(zoom)} {...roomContainerEventHandler}>
          {room.roomObjects.map((obj) =>
            <div key={obj._id} id={obj.name} v-touch={getTouchHandlers(obj)}
                 style={roomObjectContainerStyle(obj)}
            >

              {roomObjectRenderFn(obj)}

              {isSelectingObject(obj) ?
                <div
                  class="room__object__resizer"
                  {...editRoomObjectEvenHandler(obj)}
                >
                  <img alt style="width: 16px; height: 16px" src="/plugins/pos-plugin/assets/resize.svg" draggable="false"/>
                </div>
                : null}
            </div>
          )
          }
        </div>
      hooks.emit('r:updateRoomRenderFn',
        roomRenderFn,
        room,
        e => eval(e))

      return () => withScopeId(getScopeId())(roomRenderFn)()
    }
  })
  return { hooks, fn }
}

export default RoomFactory
