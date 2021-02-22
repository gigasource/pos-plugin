<script>
import { genScopeId } from '../utils';
import { online, webShopConnected } from '../AppSharedStates';
import { computed, onMounted } from 'vue'

export default {
  setup() {

    const connected = computed(() => {
      return online.value && webShopConnected.value
    })

    onMounted(() => {
      online.value = navigator.onLine
      //todo: should move to appShared?
      window.addEventListener('online', () => online.value = true)

    })

    const icon = computed(() => {
      if (connected.value) {
        return 'icon-wlan'
      } else if (online.value) {
        return 'icon-wlan-error'
      } else {
        return 'no-internet'
      }
    })

    const status = computed(() => {
      if (connected.value) {
        return 'Internet'
      } else if (online.value) {
        return 'Error'
      } else {
        return 'No Internet'
      }
    })

    return genScopeId(() =>
        <div class="connection-status" style={{ color: connected.value ? '#2979FF' : '#FF4452' }}>
          <g-icon size="20" class="mr-2">{icon.value}</g-icon>
          {status.value}
        </div>
    )
  }
}
</script>

<style scoped lang="scss">
.connection-status {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

@media screen and (max-width: 1023px) {
  .connection-status {
    font-size: 12px;
  }
}
</style>
