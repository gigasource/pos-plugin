<script>
  import RoomFactory from './RoomFactory';
  import { addRoomItem } from './room-logic'
  const { fn, hooks } = RoomFactory()

  let room
  const table1 = {
    name: 't1',
    location: { x: 5, y: 10 },
    size: { width: 10, height: 10 }
  };
  const table2 = {
    name: 't2',
    location: { x: 50, y: 50 },
    size: { width: 10, height: 10 }
  };
  const wall1 = {
    name: 'w1',
    location: { x: 30, y: 10 },
    size: { width: 10, height: 2 }
  };
  //

  hooks.on('room', _room => {
    room = _room
    addRoomItem(room, table1)
    addRoomItem(room, table2)
    addRoomItem(room, wall1)
  })

  // const ui2RenderFn = (room, fetchInProgressTables, isBusyTable) => <div>
  //   {room.items.length}
  // </div>
  //
  // hooks.on('r:updateRoomRenderFn', function (
  //   roomRenderFn,
  //   room,
  //   fetchInProgressTables,
  //   isBusyTable) { this.update("roomRenderFn", () => ui2RenderFn(room, fetchInProgressTables, isBusyTable))})
  export default fn()
</script>
