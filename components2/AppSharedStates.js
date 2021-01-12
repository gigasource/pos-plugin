import Hooks from 'schemahandler/hooks/hooks'
import { reactive, ref, watch } from 'vue';

export const appHooks = new Hooks()

export const user = ref(null)

appHooks.on('updateUser', function (value) {
  user.value = value
})

watch(() => user.value, value => {
  if (value) console.log('user watcher', value)
}, { deep: true })


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
