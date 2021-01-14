<script>
import { useI18n } from 'vue-i18n'

export default {
  name: 'PosOrderVoicherDialog2',
  setup() {
    const { t: $t } = useI18n()
    return () => <g-dialog v-model="internalValue" width="600">
      <g-card>
        <g-tabs vertical items={tabs} v-model={tab} active-text-color="#1471FF" slider-color="#1471FF">
          <g-tab-item item={tabs[0]}>
            <pos-textfield-new class="mb-3 mt-4" label={$t('restaurant.voucherValue')} placeholder="Voucher value" v-model="voucherValue" ref={tabs[0].ref}/>
            <div class="row-flex justify-center">
              <pos-keyboard-full class="keyboard" width="100%" type="numeric" onEnterPressed={submit(true)}/>
            </div>
          </g-tab-item>
          <g-tab-item item={tabs[1]}>
            <pos-textfield-new class="mb-3 mt-4" label={$t('restaurant.voucherValue')} placeholder="Voucher value" v-model={voucherValue} ref={tabs[1].ref}/>
            <div class="row-flex justify-center">
              <pos-keyboard-full class="keyboard" width="100%" type="numeric" onEnterPressed={submit(false)}/>
            </div>
          </g-tab-item>
        </g-tabs>
      </g-card>
    </g-dialog>
  }
}
</script>
