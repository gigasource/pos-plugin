import Hooks from 'schemahandler/hooks/hooks'
import { ref, watch } from 'vue';

export const appHooks = new Hooks()

export const user = ref(null)

appHooks.on('updateUser', function (value) {
  user.value = value
})

watch(() => user.value, value => {
  if (value) console.log('user watcher', value)
}, { deep: true })
