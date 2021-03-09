<script>
import {useI18n} from 'vue-i18n'
import {genScopeId, internalValueFactory, wId} from "../../utils";
import {addVoucher, redeemVoucher} from "../pos-logic";
import {ref, watch} from 'vue';
import {getCurrentOrder} from "../pos-logic-be";

export default {
  name: 'PosOrderVoucherDialog2',
  props: {
    modelValue: Boolean
  },
  emits: ['update:modelValue', 'addVoucher', 'redeemVoucher'],
  setup(props, {emit}) {
    //fixme: leak warnings
    const {t} = useI18n()
    const tabs = ref([{
      title: t('restaurant.createVoucher'), ref: 0
    }, {
      title: t('restaurant.redeemVoucher'), ref: 1
    }]);

    const refs = [ref(), ref()];

    const tab = ref();
    const voucherValue = ref('');
    const internalValue = internalValueFactory(props, {emit});
    const order = getCurrentOrder();

    function submit(create) {
      //todo: singleton
      if (isNaN(voucherValue.value) || !voucherValue.value) return
      if (create) {
        addVoucher(order, parseFloat(voucherValue.value));
      } else {
        redeemVoucher(order, parseFloat(voucherValue.value));
      }
      internalValue.value = false;
    }

    watch(() => tab.value, () => {
      if (tab.value && internalValue.value) {
        setTimeout(() => {
          const tfComponent = refs[tab.value.ref].value;
          tfComponent && tfComponent.$el && tfComponent.$el.click()
        }, 100)
      }
    })

    watch(() => internalValue.value, () => {
      if (internalValue.value) {
        tab.value = tabs.value[0];
        voucherValue.value = '';
      }
    })
    return genScopeId(() => <g-dialog v-model={internalValue} width="600">
      <g-card>
        <g-tabs vertical items={tabs.value} v-model={tab.value} active-text-color="#1471FF" slider-color="#1471FF">
          <g-tab-item item={tabs.value[0]}>
            {genScopeId(() => <>
              <pos-textfield-new class="mb-3 mt-4" label={t('restaurant.voucherValue')} placeholder={t('restaurant.voucherValue')}
                                 v-model={voucherValue.value} ref={refs[0]}/>
              <div class="row-flex justify-center">
                <pos-keyboard-full class="keyboard" width="100%" type="numeric"
                                   onEnterPressed={() => submit(true)}/>
              </div>
            </>)()}
          </g-tab-item>
          <g-tab-item item={tabs.value[1]}>
            {genScopeId(() => <>
              <pos-textfield-new class="mb-3 mt-4" label={t('restaurant.voucherValue')} placeholder={t('restaurant.voucherValue')}
                                 v-model={voucherValue.value} ref={refs[1]}/>
              <div class="row-flex justify-center">
                <pos-keyboard-full class="keyboard" width="100%" type="numeric"
                                   onEnterPressed={() => submit(false)}/>
              </div>
            </>)()}
          </g-tab-item>
        </g-tabs>
      </g-card>
    </g-dialog>)
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
