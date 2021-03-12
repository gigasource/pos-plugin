import { user } from './components/AppSharedStates';
import {
  setupOnlineOrderSocketPairEventHandle,
  deviceNeedToPair
} from './components/OnlineOrder/online-order-pairing';
import { initVirtualPrinterData } from './components/VirtualPrinter/virtual-printer-logics';

const publicRoutes = ['/admin' , '/plugins', '/pos-setup']

export default function () {
  window.router.beforeEach((to, from, next) => {
    if (publicRoutes.indexOf(to.path) > -1) {
      next()
    } else if (deviceNeedToPair.value) {
      next('/pos-setup')
    } else if (!user.value && to.path !== '/pos-login') {
      next('/pos-login')
    } else {
      next()
    }
  })

  setupOnlineOrderSocketPairEventHandle()
  initVirtualPrinterData()
}
