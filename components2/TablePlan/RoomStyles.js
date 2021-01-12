import { isBusyTable, isSelectingObject, isTable } from '../View/EditTablePlan/room-state';
const roomObjectContainerStyle = (object) => {
  const res = {
    position: 'absolute',
    left: `${object.realLocation.x}px`,
    top: `${object.realLocation.y}px`,
    width: `${object.realSize.width}px`,
    height: `${object.realSize.height}px`,
    border: '1px solid transparent',
    transition: 'none',
    fontWeight: '700'
  }
  if (isTable(object)) {
    res.borderRadius = `5px`;
    res.boxShadow = '0px 2px 4px rgba(131, 146, 167, 0.2)'
  }
  if (isBusyTable(object)) {
    const addStyle = { background: '#fec8c8', border: '1px solid #d2691e' }
    Object.assign(res, addStyle)
  } else {
    Object.assign(res, { background: object.bgColor })
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
  if (isSelectingObject(object)) {
    style.border = '1px solid #1271FF'
  }
  return style
}

const roomContainerStyle = (zoom) => ({
  fontSize: `${zoom.value * 20}px`,
  position: 'relative',
  width: '100%',
  height: '100%',
})


export {
  roomContainerStyle, roomObjectContainerStyle, roomObjectStyle
}
