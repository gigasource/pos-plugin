import {computed, getCurrentInstance, ref, watch, withScopeId} from "vue";
import {useI18n} from "vue-i18n";
import dayjs from "dayjs";
import {useRouter} from 'vue-router';
import cms from 'cms';

export const internalValueFactory = (props, {emit}) => {
  const rawInternalValue = ref(props.modelValue);

  watch(() => props.modelValue, () => rawInternalValue.value = props.modelValue, { lazy: true });

  const internalValue = computed({
    get: () => rawInternalValue.value,
    set: (value) => {
      rawInternalValue.value = value;
      emit('update:modelValue', rawInternalValue.value)
    }
  });

  return internalValue;
}

let inited = false;

export function genScopeId(render, currentInstance) {
  if (!inited) initUtils();
  if (render) {
    return withScopeId((currentInstance || getCurrentInstance()).type['__scopeId'])(render);
  }
  return {[(currentInstance || getCurrentInstance()).type['__scopeId']]: ''};
}

export function execGenScopeId(render, currentInstance) {
  return genScopeId(render, currentInstance)()
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

//todo dateFormat

export const formatsFactory = () => {
  const {t} = useI18n()
  const dateFormat = t('dates.dateFormat');
  return {dateFormat}
}

export const dateFormat = computed(() => {
  const {t} = useI18n();
  return t('dates.dateFormat');
});

export const timeFormat = computed(() => {
  const {t} = useI18n();
  return t('dates.timeFormat');
});

export const datetimeFormat = computed(() => {
  const {t} = useI18n();
  return `${t('dates.dateFormat')} ${t('dates.timeFormat')}`;
});

export function formatDate(date) {
  if (!date || !dayjs(date).isValid()) return ''
  return dayjs(date).format(dateFormat.value);
}

export function formatDatetime(date) {
  if (!date || !dayjs(date).isValid()) return ''
  return dayjs(date).format(datetimeFormat.value);
}

export function initUtils() {
  const [] = [
    dateFormat.value,
    timeFormat.value,
    datetimeFormat.value,
    backFn.value
  ]
  inited = true;
}

export const dateStringComputedFn = date => computed({
  get() {
    return dayjs(date.value).format('YYYY-MM-DD')
  },
  set(val) {
    date.value = dayjs(val, 'YYYY-MM-DD').toDate()
  }
});

export const backFn = computed(() => {
  const router = useRouter()

  function back() {
    router.push({path: '/pos-dashboard'})
  }

  return back;
})

export async function socketEmit() {
  return await new Promise(resolve => cms.socket.emit(...arguments, resolve));
}
