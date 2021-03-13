import cms from 'cms';
import { _posSettings,  user } from './components/AppSharedStates';
import { initVirtualPrinterData } from './components/VirtualPrinter/virtual-printer-logics';
import {
  setupOnlineOrderSocketPairEventHandle,
  deviceNeedToPair
} from './components/OnlineOrder/online-order-pairing';

const publicRoutes = ['/admin' , '/plugins', '/plugins/', '/pos-setup']
function handleBeforeEachRoute(to, from, next) {
  if (publicRoutes.indexOf(to.path) > -1) {
    next()
  } else if (deviceNeedToPair.value) {
    next('/pos-setup')
  } else if (!user.value && to.path !== '/pos-login') {
    next('/pos-login')
  } else {
    next()
  }
}

export default async function init() {
  _posSettings.value = await cms.getModel('PosSetting').findOne()
  await setupOnlineOrderSocketPairEventHandle()
  await initVirtualPrinterData()
  window.router.beforeEach(handleBeforeEachRoute)
  handleBeforeEachRoute({path: location.pathname}, {},
      path => path && window.router.push({path}))
}
