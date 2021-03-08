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

