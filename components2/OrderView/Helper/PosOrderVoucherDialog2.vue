<script>
import {useI18n} from 'vue-i18n'
import {internalValueFactory} from "../../utils";
import {addVoucher, redeemVoucher} from "../pos-logic";

export default {
  name: 'PosOrderVoucherDialog2',
  props: {
    modelValue: Boolean
  },
  emits: ['update:modelValue', 'addVoucher', 'redeemVoucher'],
  setup(props, {emit}) {
    const {t: $t} = useI18n()
    const tabs = ref([{
      title: $t('restaurant.createVoucher'), ref: 'createTf'
    }, {
      title: $t('restaurant.redeemVoucher'), ref: 'redeemTf'
    }]);

    const tab = ref();
    const voucherValue = ref('');
    const internalValue = internalValueFactory(props, {emit});

    function submit(create) {
      //todo: singleton
      if (isNaN(voucherValue.value) || !voucherValue.value) return
      if (create) {
        addVoucher(order, voucherValue.value);
      } else {
        redeemVoucher(order, voucherValue.value);
      }
      internalValue.value = false;
    }

    watch(() => tab.value, () => {
      if (tab.value && internalValue.value) {
        setTimeout(() => {
          const tfComponent = tab.value;
          tfComponent && tfComponent.$el && tfComponent.$el.click()
        }, 500)
      }
    })

    watch(() => internalValue.value, () => {
      if (internalValue.value) {
        tab.value = tabs[0].value;
        voucherValue.value = '';
      }
    })

    return () => <g-dialog v-model={internalValue} width="600">
      <g-card>
        <g-tabs vertical items={tabs.value} v-model={tab.value} active-text-color="#1471FF" slider-color="#1471FF">
          <g-tab-item item={tabs.value[0]}>
            <pos-textfield-new class="mb-3 mt-4" label={$t('restaurant.voucherValue')} placeholder="Voucher value"
                               v-model={voucherValue.value} ref={tabs.value[0].ref}/>
            <div class="row-flex justify-center">
              <pos-keyboard-full class="keyboard" width="100%" type="numeric" onEnterPressed={() => submit(true)}/>
            </div>
          </g-tab-item>
          <g-tab-item item={tabs.value[1]}>
            <pos-textfield-new class="mb-3 mt-4" label={$t('restaurant.voucherValue')} placeholder="Voucher value"
                               v-model={voucherValue.value} ref={tabs.value[1]}/>
            <div class="row-flex justify-center">
              <pos-keyboard-full class="keyboard" width="100%" type="numeric" onEnterPressed={() => submit(false)}/>
            </div>
          </g-tab-item>
        </g-tabs>
      </g-card>
    </g-dialog>
  }
}
</script>

<style scoped lang="scss">
.keyboard {
  background-color: #bdbdbd;
  padding: 0.5rem;
  flex-grow: 1;
}

::v-deep .key {
  border: 1px solid #BDBDBD;
  border-radius: 2px;
  font-size: 24px;
  font-weight: 700;
  box-shadow: unset;
  padding-top: 16px;
  padding-bottom: 16px;
}

@media screen and (max-height: 599px) {
  ::v-deep .keyboard__template {
    grid-gap: 5px !important;

    .key {
      font-size: 16px;
      padding: 8px;
    }
  }
}
</style>
