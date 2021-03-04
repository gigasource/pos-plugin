<script>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { user } from './AppSharedStates';
import cms from 'cms'

// This file is for emitting screen-loaded
export default {
  name: 'EmptyStore',
  domain: 'EmptyStore',
  props: {},
  setup() {
    // TODO: navigate to login page if the user is not logged-in
    // Issue: not work as the Store loaded same time with component, only work in next route navigation.
    // const router = useRouter()
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

    onMounted(() => {
      cms.socket.emit('screen-loaded')
    })
  }


}
</script>
