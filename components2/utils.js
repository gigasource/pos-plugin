import {computed, getCurrentInstance, withScopeId} from "vue";

export const internalValueFactory = (props, {emit}) => {
  return computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })
}

export function genScopeId(render) {
  if (render) {
    return withScopeId(getCurrentInstance().type['__scopeId'])(render);
  }
  return {[getCurrentInstance().type['__scopeId']]: ''};
}

export const parseNumber = function(number) {
  const res = parseFloat(number)
  if (isNaN(res)) return 0
  else return res
}

export const VModel_number = (obj, field = 'value') => {
  return computed({
    get: () => obj[field],
    set: (val) => obj[field] = parseNumber(val)
  })
}
