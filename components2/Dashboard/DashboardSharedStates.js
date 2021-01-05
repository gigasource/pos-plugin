import { ref } from 'vue';
import Hooks from 'schemahandler/hooks/hooks'

export const dashboardHooks = new Hooks()
export const activeScreen = ref('functions')
export const enabledFeatures = ref([])

hooks.on('updateScreen', function (val) {
  activeScreen.value = val
})
