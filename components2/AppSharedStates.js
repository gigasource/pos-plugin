import Hooks from 'schemahandler/hooks/hooks'
import { computed, ref, watch, reactive } from 'vue';
import {mobileCheck} from "../components/logic/commonUtils";
import cms from 'cms';

export const appHooks = new Hooks()

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


export const posSettings = ref({})
appHooks.on('settingChange', async function() {
  posSettings.value = await cms.getModel('PosSetting').findOne()
})
