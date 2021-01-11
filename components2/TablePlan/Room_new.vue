<script>
  import RoomFactory from './RoomFactory';
  import { addRoomObject } from './room-logic'
  import { getCurrentInstance } from 'vue';
  const { fn, hooks } = RoomFactory()

  // let room
  // const table1 = {
  //   name: 't1',
  //   location: { x: 5, y: 10 },
  //   size: { width: 30, height: 30 },
  //   bgColor: 'red'
  // };
  // const table2 = {
  //   name: 't2',
  //   location: { x: 100, y: 70 },
  //   size: { width: 40, height: 40 },
  //   bgColor: 'red'
  // };
  // const wall1 = {
  //   name: 'w1',
  //   location: { x: 30, y: 10 },
  //   size: { width: 100, height: 2 },
  //   bgColor: 'black'
  // };
  //

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
<style scoped lang="scss">
.room {
  position: relative;
  width: 100%;
  height: 100%;
  background-image: url('/plugins/pos-plugin/assets/out.png');

  &__object__resizer {
    width: 24px;
    height: 24px;
    border-radius: 100%;
    background-color: #2979FF;
    position: absolute;
    right: 0;
    bottom: 0;
    transform: translate(100%, 100%);
    display: flex;
    justify-content: center;
    align-items: center;
  }

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
