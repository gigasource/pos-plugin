import roomLogics from './room-logic'
import Hooks from 'schemahandler/hooks/hooks'
import { computed, onMounted } from 'vue'
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
      const { createRoom, isBusyTable, fetchInProgressTables } = roomLogics
      const { room, viewW, viewH } = createRoom(props.roomObjects)
      hooks.emit('room', room, e => eval(e))
      const style = (item) => ({
        position: 'absolute',
        left: item.realLocation.x + "px",
        top: item.realLocation.y + "px",
        width: item.realSize.width + "px",
        height: item.realSize.height + "px",
        background: "green"
      })
      const roomRenderFn = () => <div style={{position: 'relative'}}>
        {room.items.map((item) => <div style={style(item)} >
          <p> {item.name} </p>
        </div>)
        }
      </div>

      hooks.emit('r:updateRoomRenderFn',
        roomRenderFn,
        room,
        fetchInProgressTables,
        isBusyTable,
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
