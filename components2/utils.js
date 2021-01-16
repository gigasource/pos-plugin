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
