import { appHooks, user } from './components2/AppSharedStates';
import { getPairStatus, getWebshopName, setupPairDevice } from './components2/OnlineOrder/online-order-pairing';
import { initVirtualPrinterData } from './components2/VirtualPrinter/virtual-printer-logics';

export default function () {
  window.router.beforeEach((to, from, next) => {
    if (to.path === '/admin' || to.path === '/plugins' || to.path === '/pos-login' || to.path === '/pos-setup') {
      next()
    } else if (!user.value) {
      next('/pos-login')
    } else {
      next()
    }
  })

  cms.socket.on('updateAppFeature', () => {
    console.log('updateAppFeature')
    appHooks.emit('updateEnabledFeatures')
  })

  setupPairDevice()
  getPairStatus()
  getWebshopName()

  initVirtualPrinterData()
}
