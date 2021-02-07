<script>
import PosKeyboardFull from '../../pos-shared-components/PosKeyboardFull';
import { computed, onMounted, ref, watch } from 'vue'
import { $filters, isMobile } from '../../AppSharedStates';
import { useI18n } from 'vue-i18n';
import PaymentLogicsFactory from '../payment-logics';
import { GDivider, GIcon, GSpacer, GTable } from '../../../../../backoffice/pos-vue-framework';
import PosTextfieldNew from '../../pos-shared-components/POSInput/PosTextfieldNew';
import { genScopeId, VModel_number } from '../../utils';

export default {
  name: 'PosPaymentScreenKeyboard2',
  components: [PosKeyboardFull, GTable, GSpacer, GIcon, PosTextfieldNew, GDivider],
  setup: function (props, { emit }) {

    const cashTextfield = ref(null)
    const { currentOrder, currentOrderChange, currentOrderPaymentList, currentOrderTip, selectedPayment } = PaymentLogicsFactory()

    onMounted(() => {
      watch(() => selectedPayment.value, () => {
        const hasCashPayment = currentOrderPaymentList.value.some(i => i.type === 'cash')
        if (hasCashPayment) {
          setTimeout(() => {
            cashTextfield.value.$el.click()
            const input = cashTextfield.value.$el.querySelector('input')
            input && input.select()

          }, 500)
        }
      }, { deep: true })
    })
    const { t } = useI18n()
    const keyboardTemplate = 'grid-template-areas: " key7 key7 key8 key8 key9 key9" ' +
        '"key4 key4 key5 key5 key6 key6" ' +
        '"key1 key1 key2 key2 key3 key3" ' +
        '"keyDot keyDot key0 key0 del del";' +
        'grid-auto-columns: 1fr; grid-gap: 5px'
    const keyboardItems = [
      ...Object.values({
        key7: { content: ['7'], style: 'grid-area: key7' },
        key8: { content: ['8'], style: 'grid-area: key8' },
        key9: { content: ['9'], style: 'grid-area: key9' },
        key4: { content: ['4'], style: 'grid-area: key4' },
        key5: { content: ['5'], style: 'grid-area: key5' },
        key6: { content: ['6'], style: 'grid-area: key6' },
        key1: { content: ['1'], style: 'grid-area: key1' },
        key2: { content: ['2'], style: 'grid-area: key2' },
        key3: { content: ['3'], style: 'grid-area: key3' },
        key0: { content: ['0'], style: 'grid-area: key0' },
        keyDot: { content: ['.'], style: 'grid-area: keyDot' },
      }),
      {
        content: [''],
        img: 'delivery/key_delete',
        style: 'grid-area: del; background-color: #e0e0e0',
        action: 'delete'
      }
    ]

    const disableKeyboard = computed(() => {
      return !currentOrder.payment || !currentOrder.payment.some(i => i.type === 'cash')
    })
    //todo: move to payment-logics
    const removePaymentItem = function (index) {
      currentOrder.payment.splice(index, 1)
    }

    return genScopeId(() =>
        <>
          <div class="pos-payment-keyboard">
            <div style="position: relative" class="col-6">
              <pos-keyboard-full template={keyboardTemplate} items={keyboardItems} gap="4px" style="height: 100%">
              </pos-keyboard-full>
              {
                (disableKeyboard.value) &&
                <div class="keyboard-overlay">
                </div>
              }
            </div>
            <div class={['col-flex', isMobile.value && 'payment-table--mobile']} style="height: 100%; margin-left: 8px; flex: 1">
              <div class="payment-table__header">
                <span>
                  {t('onlineOrder.total')} </span>
                <g-spacer>
                </g-spacer>
                <span class="total-value">
                  {$filters.formatCurrency(currentOrder.vSum)} </span>
              </div>
              <g-table class="payment-table flex-grow-1" striped fixed-header>
                <tbody>
                {currentOrderPaymentList.value.map((payment, index) =>
                    <tr>
                      <div class={['payment-table__row', payment.type !== 'card' && payment.type !== 'cash' && 'text-blue']}>
                        <div class="flex-grow-1 row-flex align-items-center">
                          <span style="text-transform: capitalize">
                            {
                              (payment.type === 'card' || payment.type === 'cash') ? t(`payment.${payment.type}`) : payment.type
                            }
                          </span>
                          {
                            (payment.type !== 'card' && payment.type !== 'cash') &&
                            <g-icon class="ml-2" onClick={() => removePaymentItem(index)} color="#FF4452" size="16"> close </g-icon>
                          }
                        </div>
                        <div class="value-input w-20">
                          {
                            (payment.type === 'cash') ?
                                <pos-textfield-new v-model={VModel_number(payment).value}
                                                   ref={cashTextfield}>
                                </pos-textfield-new>
                                :
                                <span> {payment.value} </span>
                          }
                        </div>
                      </div>
                    </tr>
                )} </tbody>
              </g-table>
              <div class="payment-table__footer">
                {
                  (!disableKeyboard.value) &&
                  <div class="payment-change__description mt-2">
                    {t('payment.enterTender')} </div>
                }
                <g-divider inset class="mb-2">
                </g-divider>
                <div class="payment-footer">
                  <div class="row-flex payment-footer__value">
                    <div class="flex-grow-1">
                      {t('payment.change')} </div>
                    {
                      (!isNaN(currentOrderChange.value)) ?
                          <div class="payment-footer__value__number">
                            {$filters.formatCurrency(+currentOrderChange.value || 0, 2)} </div>
                          :
                          <div class="payment-footer__value__number">
                            {$filters.formatCurrency(0, 2)} </div>
                    }
                  </div>
                  {
                    (currentOrderTip.value > 0) &&
                    <div class="row-flex payment-footer__value">
                      <div class="flex-grow-1">
                        {t('payment.tip')} </div>
                      <g-spacer>
                      </g-spacer>
                      <div class="payment-footer__value__number">
                        {$filters.formatCurrency(currentOrderTip.value)} </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </>
    )
  }
}
</script>

<style scoped lang="scss">
.pos-payment-keyboard {
  background-image: url('../../../assets/pos-payment-method-screen-bg.png');
  background-repeat: repeat;
  padding: 8px !important;
  display: flex;

  .keyboard-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 0.6);
    z-index: 1;
  }
}

::v-deep .payment-table {
  .g-table__wrapper {
    position: relative;
  }
}

.payment-table {
  border: 1px solid #bdbdbd;
  border-bottom: 0;
  background-color: #EEEEEE;
  height: 100%;
  overflow: scroll;

  &__header {
    background-color: #EEEEEE;
    padding: 5px 8px 2px 8px;
    font-weight: bold;
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 16px;
    border: 1px solid #bdbdbd;
    border-bottom: 0;
    border-top-left-radius: 2px;
    border-top-right-radius: 2px;
  }

  &__footer {
    background-color: #EEEEEE;
    border: 1px solid #bdbdbd;
    border-top: 0;
    border-bottom-left-radius: 2px;
    border-bottom-right-radius: 2px;
    font-size: 14px;
    padding: 0 8px 5px 8px;
  }

  &__row {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    font-size: 14px;
    padding: 2px 8px;

    ::v-deep .value-input {
      text-align: right;

      .bs-tf-wrapper {
        width: 100%;
        margin: 8px 0;
      }

      .bs-tf-inner-input-group, .bs-tf-input {
        background-color: white;
      }

      input {
        line-height: 22px;
        padding: 4px 0;
        font-size: 14px;
        text-align: right;
      }
    }
  }
}

.payment-table--mobile {
  .payment-table {
    &__header {
      padding: 5px 8px 2px 8px;
    }

    &__footer {
      padding: 0 8px 5px 8px;
    }

    &__row {
      font-size: 14px !important;
      padding: 2px 8px;

      ::v-deep .value-input {
        .g-tf-wrapper {
          margin: 0;
          width: 100%;
        }

        input {
          line-height: 16px;
          font-size: 14px;
        }
      }
    }
  }
}

.text-blue {
  color: #1976D2;
}

.total-value {
  font-size: 18px;
}

.payment-footer {
  font-weight: bold;
  font-size: 16px !important;

  &__description {
    font-size: 13px;
    color: #1D1D26;
    font-weight: normal;
  }

  &__value {
    height: initial;

    &__number {
      font-size: 20px !important;
      color: #1271ff;
    }
  }
}

::v-deep .key {
  border: 1px solid #BDBDBD;
  border-radius: 2px;
  font-size: 24px;
  font-weight: 700;
  box-shadow: unset;
}

@media screen and (max-height: 600px) {
  .pos-payment-keyboard ::v-deep .key {
    font-size: 18px;
  }
}
</style>
