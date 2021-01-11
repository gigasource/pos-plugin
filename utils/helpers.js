import {getCurrentInstance} from 'vue'

const getScopeId = function() {
  const instance = getCurrentInstance()
  const {type} = instance
  return type ? type.__scopeId : ''
}

const getScopeAttrs = () => {
  const scopeId = getScopeId()
  return { ...scopeId ? { [scopeId]: '' } : {} }
}

export {
  getScopeId,
  getScopeAttrs
}
