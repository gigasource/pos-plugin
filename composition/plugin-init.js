import { initPosData } from './usePosLogic';
import { initVirtualPrinterData } from '../components2/VirtualPrinter/virtual-printer-logics';
import { initOrderData } from './useOrderLogic';

export default function () {
  initPosData()
  initOrderData()
  initVirtualPrinterData()
}
