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
      const roomRenderFn = () => <div>
        {room.items.map((item) => <div>
          <p> {item.name} </p>
          <p> {item.realLocation.x} </p>
        </div>)}
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
