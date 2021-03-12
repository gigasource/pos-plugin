import { user } from './components2/AppSharedStates';
import {
  setupOnlineOrderSocketPairEventHandle,
  deviceNeedToPair
} from './components2/OnlineOrder/online-order-pairing';
import { initVirtualPrinterData } from './components2/VirtualPrinter/virtual-printer-logics';

const publicRoutes = ['/admin' , '/plugins', '/pos-setup']

export default function () {
  window.router.beforeEach((to, from, next) => {
    if (publicRoutes.indexOf(to.path) > -1) {
      next()
    } else if (deviceNeedToPair.value) {
      next('/pos-setup')
    } else if (!user.value) {
      next('/pos-login')
    } else {
      next()
    }
  })

  setupOnlineOrderSocketPairEventHandle()
  initVirtualPrinterData()
}
