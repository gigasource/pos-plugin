// multiple hardware management
import { posSettings } from './AppSharedStates';

// TODO:
//  - hardwares management
export async function registerHardware() {
  let hardwares = posSettings.value.hardwares
  if (hardwares && hardwares instanceof Array) {
    if (!hardwares.find(i => i.name === this.device))
      hardwares = [...hardwares, { name: this.device }]
  } else {
    hardwares = [{ name: this.device }]
  }
  await this.updatePosSetting('hardwares', hardwares)
}
