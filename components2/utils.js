import {computed, getCurrentInstance, withScopeId} from "vue";
import {useI18n} from "vue-i18n";
import dayjs from "dayjs";

export const internalValueFactory = (props, {emit}) => {
  return computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })
}

export function genScopeId(render, currentInstance) {
  if (render) {
    return withScopeId((currentInstance || getCurrentInstance()).type['__scopeId'])(render);
  }
  return {[(currentInstance || getCurrentInstance()).type['__scopeId']]: ''};
}

export const parseNumber = function (number) {
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

export const intervalLog = (v, duration = 100) => {
  setInterval(() => console.log(v), duration)
}

export const isSameId = function (obj, obj1) {
  return obj._id.toString() === obj1._id.toString()
}

const {t} = useI18n();
//todo dateFormat
export const dateFormat = computed(() => t('dates.dateFormat'));

export function formatDate(date) {
  if (!date || !dayjs(date).isValid()) return ''
  return dayjs(date).format(dateFormat.value);
}
