<script>
import { onMounted, withModifiers } from 'vue'
import { genScopeId } from '../../utils'
import {
  ledDisplayDevices,
  ledDisplayInterfaces,
  loadSerialDisplays,
  saveLedDisplayConfig,
  selectedLedDisplayDevice,
  selectedLedDisplayInterface,
  testLedDisplay
} from './customer-led-display-shared'

export default {
  name: 'CustomerLedDisplay',
  props: {},
  setup() {
    onMounted(() => {
      loadSerialDisplays()
    })

    function renderGGridSelectItem(selected) {
      const borderColor = selected ? '#90CAF9' : '#e0e0e0'
      const backgroundColorProp = selected ? { 'background-color': '#E3F2FD' } : {}
      return ({ toggleSelect, item }) => {
        return <g-btn-bs
            border-color={borderColor} text-color="black" width="72" height="30" {...{ backgroundColorProp: backgroundColorProp }}
            onClick={withModifiers(() => toggleSelect(item), ['stop'])}>
          {item.text}
        </g-btn-bs>
      }
    }

    return genScopeId(() =>
        <div class="customer-led-display">
          <div class="mb-2">
            <div class="mb-2">Type</div>
            <div class="row-flex">
              <g-grid-select grid={false} items={ledDisplayInterfaces} v-model={selectedLedDisplayInterface.value} mandatory v-slots={{
                default: renderGGridSelectItem(false),
                selected: renderGGridSelectItem(true)
              }}/>
            </div>
          </div>
          <div>
            <div class="mb-2">Devices</div>
            <g-grid-select grid={false} items={ledDisplayDevices.value} v-model={selectedLedDisplayDevice.value} mandatory v-slots={{
              default: renderGGridSelectItem(false),
              selected: renderGGridSelectItem(true)
            }}/>
            <div class="row-flex justify-end mt-5">
              <g-btn-bs disabled={!selectedLedDisplayDevice.value} border-color="#e0e0e0" onClick={() => testLedDisplay()}>Test</g-btn-bs>
              <g-btn-bs disabled={!selectedLedDisplayDevice.value} border-color="#e0e0e0" onClick={() => saveLedDisplayConfig()}>Save</g-btn-bs>
            </div>
          </div>
        </div>
    )
  }
}
</script>

<style scoped lang="scss">
.customer-led-display {
  padding: 20px;
  flex: 1 1 0;
  height: 100%;
}
</style>
