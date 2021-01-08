import { createRoom, updateRoomObjects } from './room-logic'
import { isBusyTable, getTableOrderInfo, onSelectObject, isSelectingObject } from '../View/EditTablePlan/room-state'
import Hooks from 'schemahandler/hooks/hooks'
import { ref, onMounted, computed, watch, toRaw } from 'vue'
import {getDiffTime} from '../../utils/commons';

const RoomFactory = () => {
  const hooks = new Hooks()
  const fn = () => ({
    name: 'Room',
    props: {
      roomObjects: {
        type: Array
      }
    },
    setup(props) {
      const { room, viewW, viewH, zoom, updateObjectLocation, updateObjectSize } = createRoom({ roomObjects: props.roomObjects })
      const curTime = ref(new Date())
      const selectingObject = ref(null)
      watch(() => props.roomObjects, (newV, oldV) => {
        updateRoomObjects(room, newV)
      }, { deep: true })
      hooks.emit('room', room, e => eval(e))
      const style = (item) => ({
        position: 'absolute',
        left: item.realLocation.x + 'px',
        top: item.realLocation.y + 'px',
        width: item.realSize.width + 'px',
        height: item.realSize.height + 'px',
        background:  (isBusyTable(item) ? 'red' : item.bgColor)
      })

      const roomContainerStyle = () => ({
        fontSize: `${zoom.value *15}px`,
        position: 'relative',
        // zoom: `${zoom.value * 100}%`,
        width: '1000px',
        height: '500px',
        background: 'green',
      })

      const roomContainer = ref(null)
      onMounted(() => {
        viewW.value = roomContainer.value.offsetWidth
        viewH.value = roomContainer.value.offsetHeight

        setInterval(() => {
          curTime.value = new Date()
        }, 30000)
      })

      const objectInfoRenderFn = (item) => {
        const isActiveTable = item.type === 'table' && isBusyTable(item)
        const tableOrderInfo = getTableOrderInfo(item)
        return <div>
          <p> {item.name} </p>
          {isActiveTable ?
            <div> {getDiffTime(tableOrderInfo.date, curTime.value)} mins </div> : null}
        </div>
      }
      const roomRenderFn = () => <div id="room" ref={roomContainer} style={roomContainerStyle()}>
        {room.roomObjects.map((item) => <div id = {item.name} style={style(item)} onClick={() => onSelectObject(item)}>
          {objectInfoRenderFn(item)}
        </div>)
        }
      </div>

      hooks.emit('r:updateRoomRenderFn',
        roomRenderFn,
        room,
        e => eval(e))
      return () => <>
        {roomRenderFn()}
      </>
    }
  })

  return {
    hooks,
    fn
  }
}

export default RoomFactory
