import Hooks from 'schemahandler/hooks/hooks'
import {computed, ref, watch, reactive} from 'vue';
import { mobileCheck } from '../utils/mobileCheck';
import cms from 'cms';
import {getCurrentOrder, syncOrderChange} from "./OrderView/pos-logic-be";
import { initCallSystem } from './Settings/CallSystem/call-system-logics'
import _ from 'lodash';
import { initBell } from "./OnlineOrder/online-order-logic-shared";

export const appHooks = new Hooks()

export const dateTime = ref(new Date())
setInterval(() => {
  dateTime.value = new Date()
}, 60000)
export const timeFormat = ref('HH:mm') // TODO: i18n dates.timeFormat
export const dateFormat = ref('DD-MM-YYYY') // TODO: i18n dates.dateFormat
export const formattedDateTime = computed(() => {
  return dayjs(dateTime.value).format(`${timeFormat.value} ‧ ${dateFormat.value}`)
})
export const formattedTime = computed(() => {
  return dayjs(dateTime.value).format(`${timeFormat.value}`)
})

export const user = ref(null)
export const avatar = computed(() => user.value ? user.value.avatar : '');
export const username = computed(() => user.value ? user.value.name : '');

export function isAdmin(user) {
  return user && user.role === 'admin'
}

export const currentUserIsAdmin = computed(() => user.value && isAdmin(user.value))
export const isLoggedIn = computed(() => !!user.value)

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

export const online = ref(true)
window.addEventListener('online', () => online.value = true)
window.addEventListener('offline', () => online.value = false);
export const webShopConnected = ref(true)
appHooks.on('updateWebShopConnectionStatus', () => {
  cms.socket.emit('socketConnected', value => {
    webShopConnected.value = value
  })
})

export const version = ref('0.0.0')
appHooks.on('updateVersion', () => {
  cms.socket.emit('get-app-version', _version => {
    if (_version) version.value = _version
  })
})

export const storeId = ref('')
appHooks.on('updateStoreId', () => {
  cms.socket.emit('getWebshopId', sId => {
    storeId.value = sId || ''
  })
})

export const locale = ref('en')
appHooks.on('changeLocale', async (_locale) => {
  await cms.getModel('SystemConfig').updateOne({ type: 'I18n' }, { 'content.locale': _locale }, { upsert: true })
  locale.value = _locale
})

appHooks.on('fetchLocale', async() => {
  const config = await cms.getModel('SystemConfig').findOne({ type: 'I18n'})
  if (config) {
    locale.value = config.content.locale
  }
})

//fixme: remove by production
//isMobile.value = true;

export const $filters = {
  formatCurrency(val, decimals = 2) {
    if (!val || isNaN(val) || Math.floor(val) === val) return val
    return Number(val).toFixed(decimals)
  }
}


export const notifyState = reactive({
  show: false,
  content: null,
  color: null
})

export function showNotify(content, color = '#536dfe') {
  notifyState.content = content || 'Saved'
  notifyState.color = color
  notifyState.show = true
}


export const activeOrders = ref([]);

appHooks.on('orderChange', async function () {
  activeOrders.value = await cms.getModel('Order').find({status: 'inProgress'});
  const order = getCurrentOrder();
  if (order._id && _.find(activeOrders.value, {_id: order._id})) {
    await syncOrderChange(_.find(activeOrders.value, {_id: order._id}));
  }
})

cms.socket.on('update-table', () => appHooks.emit('orderChange'))

const _posSettings = ref()
export const posSettings = computed(() => {
  if (!_posSettings.value) {
    appHooks.emit('settingChange');
    return {};
  }
  return _posSettings.value;
})
appHooks.on('settingChange', async function () {
  _posSettings.value = await cms.getModel('PosSetting').findOne()
})

export const generalSettings = computed(() => {
  return (posSettings.value && posSettings.value.generalSetting) || {}
})

export const tseConfig = ref({})
appHooks.on('updateTseConfig', async () => {
  tseConfig.value = await cms.getModel('tseConfig').findOne()
})

export const enabledFeatures = ref([])
appHooks.on('updateEnabledFeatures', async () => {
  const _enabledFeatures = await cms.getModel('Feature').find({enabled: true})
  enabledFeatures.value = _enabledFeatures.map(feature => feature.name)
})

export const storeLocale = computed(() => {
  return ((posSettings.value
      && posSettings.value.onlineDevice
      && posSettings.value.onlineDevice.store
      && posSettings.value.onlineDevice.store.locale) || locale.value || 'en')
})

// init call system in the very first moment
initCallSystem()
initBell(posSettings)

export const javaData = ref('Java Log:\n')
cms.socket.on('javaData', (data) => {
  javaData.value += JSON.stringify(data.message ? data.message : data) + '\n'
})
