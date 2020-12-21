import _ from 'lodash'
import { reactive } from 'vue'

function RoomStore() {
  const rooms = reactive([])

  async function reloadRooms() {
    const foundRooms = await cms.getModel('Room').find({})
    rooms.value.splice(0, rooms.value.length, ...orderRooms(foundRooms))
  }

  function orderRooms(rooms) {
    return _.orderBy(rooms, ['order'], ['asc']);
  }

  // created
  rooms.value = orderRooms(cms.getList('Room'))

  return {
    rooms,
    reloadRooms
  }
}

let _roomStore;
export default {
  getInstance() {
    if (!_roomStore)
      _roomStore = new RoomStore()
    return _roomStore
  }
}
