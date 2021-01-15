import Hooks from 'schemahandler/hooks/hooks'
import { computed, ref, watch, reactive } from 'vue';
import {mobileCheck} from "../components/logic/commonUtils";

export const appHooks = new Hooks()

export const user = ref(null)

export const avatar = computed(() => user ? user.avatar : '');
export const username = computed(() => user ? user.name : '');

appHooks.on('updateUser', function (value) {
  user.value = value
})

watch(() => user.value, value => {
  if (value) console.log('user watcher', value)
}, { deep: true })

export const isMobile = mobileCheck();

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
