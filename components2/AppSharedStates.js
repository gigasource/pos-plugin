import Hooks from 'schemahandler/hooks/hooks'
import { computed, ref, watch, reactive } from 'vue';
import {mobileCheck} from "../components/logic/commonUtils";
import cms from 'cms';

export const appHooks = new Hooks()

export const appType = {
  POS_RESTAURANT: 'POS_RESTAURANT',
  POS_RETAIL: 'POS_RETAIL'
}
export const currentAppType = ref(appType.POS_RESTAURANT)

export const dateTime = ref(new Date())
setInterval(() => {
  dateTime.value = new Date()
})
export const timeFormat = ref('HH:mm') // TODO: i18n dates.timeFormat
export const dateFormat = ref('DD-MM-YYYY') // TODO: i18n dates.dateFormat
export const formattedDateTime = computed(() => {
  return dayjs(dateTime.value).format(`${timeFormat.value} ‧ ${dateFormat.value}`)
})

export const user = ref(null)
export const avatar = computed(() => user.value ? user.value.avatar : '');
export const username = computed(() => user.value ? user.value.name : '');

appHooks.on('updateUser', function (value) {
  user.value = value
})

const run = async () => {
  const users = await cms.getModel('PosUser').find();
  user.value = users.find(u => u.name === 'admin');
}

//fixme: move to lifecycle
run();

/*watch(() => user.value, value => {
  if (value) console.log('user watcher', value)
}, { deep: true })*/

export let isMobile = ref(mobileCheck());
export const isIOS = navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPod') || navigator.userAgent.includes('iPad')

//fixme: remove by production
//isMobile.value = true;

export const $filters = {
  formatCurrency(val, decimals = 2) {
    if (!val || isNaN(val) || Math.floor(val) === val) return val
    return val.toFixed(decimals)
  }
}


// TODO: added to UI somewhere
//  <g-snackbar v-model={notifyState.show} top right color="#1976d2" timeout={1000}>{notifyState.content}</g-snackbar>
// snackbar notify
export const notifyState = reactive({
  show: false,
  content: null
})

export function showNotify(content) {
  notifyState.content = content || 'Saved'
  notifyState.show = true
}


export const activeOrders = ref([]);

appHooks.on('orderChange', async function () {
  activeOrders.value = await cms.getModel('Order').find({ status: 'inProgress' });
})

cms.socket.on('update-table', () => appHooks.emit('orderChange'))


export const posSettings = ref({})
appHooks.on('settingChange', async function() {
  posSettings.value = await cms.getModel('PosSetting').findOne()
})

export const groupPrinters = ref([])
appHooks.on('updateGroupPrinters', async() => {
  groupPrinters.value = await cms.getModel('GroupPrinter').find()
})

export const tseConfig = ref({})
appHooks.on('updateTseConfig', async() => {
  tseConfig.value = await cms.getModel('tseConfig').findOne()
})

export const enabledFeatures = ref([])
appHooks.on('updateEnabledFeatures', async() => {
  const _enabledFeatures = await cms.getModel('Feature').find({ enabled: true })
  enabledFeatures.value = _enabledFeatures.map(feature => feature.name)
})

export const locale = ref('en')
export const storeLocale = computed(() => {
  return ((posSettings.value
      && posSettings.value.onlineDevice
      && posSettings.value.onlineDevice.store
      && posSettings.value.onlineDevice.store.locale) || locale.value || 'en')
})


