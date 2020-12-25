import { initPosData } from './usePosLogic';
import { initVirtualPrinterData } from './useVirtualPrinterLogic';
import { initOrderData } from './useOrderLogic';

export default function () {
  initPosData()
  initOrderData()
  initVirtualPrinterData()
}
