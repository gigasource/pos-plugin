<script>
import cms from 'cms'
import { onMounted } from 'vue'
import { appHooks, notifyState } from './AppSharedStates'

// This file is for emitting screen-loaded
export default {
  name: 'EmptyStore',
  domain: 'EmptyStore',
  props: {},
  setup() {
    appHooks.emit('settingChange')
    onMounted(() => {
      cms.socket.emit('screen-loaded')
    })

    // TODO: Move to back-office
    function renderSystemSnackbar() {
      return <g-snackbar
          top right
          v-model={notifyState.show}
          color={notifyState.color}
          timeout={2000}>
        {notifyState.content}
      </g-snackbar>
    }

    return () => {
      return <>
        {renderSystemSnackbar()}
      </>
    }
  }
}
</script>
