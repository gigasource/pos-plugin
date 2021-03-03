import { getCurrentInstance, withModifiers } from 'vue'

export const getScopeId = function() {
  const instance = getCurrentInstance()
  const {type} = instance
  return type ? type.__scopeId : ''
}

export const getScopeAttrs = () => {
  const scopeId = getScopeId()
  return { ...scopeId ? { [scopeId]: '' } : {} }
}

export const onCLick_Stop = (listener) => withModifiers(listener, ['stop'])

export function isInside(x, y, rec) {
  return (x >= rec.left && x < rec.left + rec.width) && ( y >= rec.top && y < rec.top + rec.height)
}
