<script>
import PaymentLogicsFactory from '../payment-logics';
import { onActivated, ref, watch, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n';
import { isMobile } from '../../AppSharedStates';
import { GBadge, GBtn, GIcon } from 'pos-vue-framework';
import dialogMultiPayment from './dialogMultiPayment';
import { genScopeId, VModel_number } from '../../utils';
import PosTextfieldNew from '../../pos-shared-components/POSInput/PosTextfieldNew';

//todo: ref-tip-textfield
export default {
  name: 'PosPaymentScreenPaymentMethods2',
  components: { GBtn, GIcon, GBadge, dialogMultiPayment, PosTextfieldNew },
  setup() {
    const {
      defaultPaymentList,
      onAddFixedItem,
      selectedPayment,
      getBadgeCount,
      onAddPaymentMethod,
      showMultiPaymentDialog,
      showAddTipDialog,
      tipEditValue,
      cashEditValue,
      cardEditValue,
      currentOrder,
      onSaveMulti,
      onSaveTip,
        resetStates
    } = PaymentLogicsFactory()

    onActivated(() => {
      resetStates()
    })
    const tipTextfield = ref(null)
    const { t, locale } = useI18n()
    const extraPaymentItems = ref([
      { type: 'tip', value: 0, icon: 'icon-tip' },
      { type: 'WC', value: 0.5 },
      { type: 'sodexo', value: 6 },
    ])
    //created
    // addPaymentMethod({})

    watch(() => showAddTipDialog.value, () => {
      if (showAddTipDialog.value) {
        tipEditValue.value = currentOrder.vSum
        setTimeout(() => {
          tipTextfield.value.$el.click()
        }, 500)
      }
    })
    return genScopeId(() =>
        <div class="pos-payment-method column-flex flex-wrap align-items-start pl-4 pt-4">
          <div class="row-flex">
            {defaultPaymentList.value.map(item =>
                <g-btn elevation="3"
                       uppercase={false}
                       x-large style="flex-basis: 20%"
                       class={['payment-method-btn', selectedPayment.value === item.type && 'payment-method-btn--selected']}
                       textColor={selectedPayment.value === item.type ? '#fff' : '#1D1D26'}
                       onClick={withModifiers(() => onAddPaymentMethod(item), ['stop'])}>
                  {
                    (item.icon) && <g-icon size="20"> {item.icon} </g-icon>
                  }
                  <span class="ml-2" style="text-transform: capitalize"> {t(`payment.${item.type}`)} </span>
                </g-btn>
            )}
          </div>
          <div class="row-flex">
            {extraPaymentItems.value.map(item =>
                (getBadgeCount(item)) ?
                    <g-btn elevation="3"
                           uppercase={false}
                           x-large
                           class="payment-method-btn"
                           onClick={withModifiers(() => onAddFixedItem(item), ['stop'])}>
                      {
                        (item.icon) && <g-icon size="20"> {item.icon} </g-icon>
                      }
                      <span class="mr-2" style="text-transform: capitalize">
                        {`${item.type}${item.value ? ` ${t('common.currency', locale.value)}${item.value}` : ''}`}
                      </span>
                      <g-badge inline={true} color="#FF4452" v-slots={{
                        'badge': () => <div> {getBadgeCount(item)} </div>
                      }}>
                      </g-badge>
                    </g-btn>
                    :
                    <g-btn
                        elevation="3"
                        uppercase={false}
                        x-large
                        style="flex-basis: 20%"
                        class="payment-method-btn"
                        onClick={withModifiers(() => onAddFixedItem(item), ['stop'])}>
                      {
                        (item.icon) && <g-icon size="20"> {item.icon} </g-icon>
                      }
                      <span style="text-transform: capitalize">
                        {`${item.type}${item.value ? ` ${t('common.currency', locale.value)}${item.value}` : ''}`}
                      </span>
                    </g-btn>
            )}
          </div>
          <dialog-multi-payment v-model={showMultiPaymentDialog.value}
                                total={currentOrder.vSum}
                                cardValue={cardEditValue.value}
                                cashValue={cashEditValue.value}
                                isMobile={isMobile.value}
                                onSubmit={onSaveMulti}
          />
          <dialog-form-input width="40%"
                             v-model={showAddTipDialog.value}
                             keyboard-type="numeric" onSubmit={onSaveTip} keyboard-width="100%" v-slots=
                                 {{
                                   'input': () =>
                                       <pos-textfield-new ref={tipTextfield}
                                                          label="Card Payment"
                                                          v-model={VModel_number(tipEditValue).value}
                                                          clearable
                                       />
                                 }}
          />
        </div>)
  }
}
</script>

<style scoped lang="scss">
.main {
  display: flex;
  flex-grow: 1;
  flex-basis: 0;
  padding: 12px 0;

  .g-row {
    align-content: flex-start;
  }
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

.payment {
  .layout__right {
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
  }
}

.payment-method-btn {
  margin: 0 0 12px 12px !important;
  height: 64px !important;
  background-color: white !important;

  &--selected {
    background-color: #297aff !important;
  }
}

.dialog {
  .g-btn-bs {
    margin: 0;
    flex-basis: 40%;
    height: 50px;
  }

  .bs-tf-wrapper {
    margin-bottom: 0;
    margin-top: 0;
    margin-right: 0;

    .bs-tf-inner-input-group {
      border-radius: 2px;
    }
  }

  .g-tf-wrapper {
    margin-bottom: 0;
    margin-top: 0;
    margin-right: 0;
  }
}

@media screen and (max-height: 600px) {
  .payment-method-btn {
    height: 36px !important;
  }
}
</style>
