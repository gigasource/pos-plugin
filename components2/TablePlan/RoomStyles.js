import { isTable } from './RoomLogics';
import { selectingRoomStates } from './RoomState';
import { computed } from 'vue'

const RoomStyleFactory = () => {

  const roomObjectContainerStyle = (object) => {
    const res = {
      position: 'absolute',
      left: `${object.realLocation.x}px`,
      top: `${object.realLocation.y}px`,
      width: `${object.realSize.width}px`,
      height: `${object.realSize.height}px`,
      border: '1px solid transparent',
      transition: 'none',
      fontWeight: '700',
      background: object.bgColor,
    }
    if (isTable(object)) {
      res.borderRadius = `5px`;
      res.boxShadow = '0px 2px 4px rgba(131, 146, 167, 0.2)'
    }
    return res
  }

  const roomObjectStyle = (object) => {
    const style = {
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      pointerEvents: 'none',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    };

    if (isTable(object)) {
      style.borderRadius = `4px`;
    }
    // if (isSelectingObject(object)) {
    //   style.border = '1px solid #1271FF'
    // }
    return style
  }

  const roomContainerStyle = computed(() => ({
    fontSize: `${(selectingRoomStates.value ? selectingRoomStates.value.zoom : 1) * 20}px`,
    position: 'relative',
    width: '100%',
    height: '100%',
  }))

  return {roomObjectContainerStyle, roomObjectStyle, roomContainerStyle}
}

export default RoomStyleFactory
