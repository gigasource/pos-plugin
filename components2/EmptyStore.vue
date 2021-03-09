<script>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
// import { user } from './AppSharedStates';
import cms from 'cms'
import { appHooks, notifyState } from './AppSharedStates'
import { useDeviceManagementSystem } from './online-order-pairing'

// This file is for emitting screen-loaded
export default {
  name: 'EmptyStore',
  domain: 'EmptyStore',
  props: {},
  setup() {
    // TODO: navigate to login page if the user is not logged-in
    // Issue: not work as the Store loaded same time with component, only work in next route navigation.
    const router = useRouter()
    // router.beforeEach((to, from, next) => {
    //   console.log('beforeEach', to, from, next, user.value)
    //   if (to.path === '/admin' || to.path === '/plugins' || to.path === '/pos-login' || to.path === '/pos-setup') {
    //     next()
    //   } else if (!user.value) {
    //     next('/pos-login')
    //   } else {
    //     next()
    //   }
    // })

    const {
      setupPairDevice,
      getPairStatus,
      getWebshopName
    } = useDeviceManagementSystem(router)

    appHooks.emit('settingChange')

    onMounted(() => {
      setTimeout(async () => {
        await setupPairDevice()
        await getPairStatus()
        await getWebshopName()
      }, 500)
      cms.socket.emit('screen-loaded')
    })

    return () => {
      return <div>
        <g-snackbar v-model={notifyState.show} top right color="#536dfe" timeout={2000}>
          {notifyState.content}
        </g-snackbar>
      </div>
    }
  }
}
</script>
