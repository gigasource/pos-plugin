<script>
import { withModifiers } from 'vue'

export default {
  name: 'PosOrderReceipt2',
  props: {
    // modelValue:
  },
  emits: [],
  setup(props, { emits }) {

    return () => <g-dialog fullscreen v-model="internalValue">
      <div class="receipt">
        <g-toolbar color="#EFEFEF">
          <g-btn-bs width="120" icon="icon-back" class="elevation-2" onClick_"back">
            Back
          </g-btn-bs>
          <g-btn-bs width="120" icon="icon-print" class="elevation-2" onClick_stop="print(null)">
            Print
          </g-btn-bs>
          <g-btn-bs width="120" icon="icon-receipt2" style="white-space: unset" class="elevation-2">
            <div style="line-height: 0.9">
              <p>Company</p>
              <p>Receipt</p>
            </div>
          </g-btn-bs>
          {!slit ?
              <g-menu v-model="paymentMethodMenu" content-class="menu-payment-option">
                <!--            <template#activator="{on}">-->
                <!--            <g-btn-bs class="elevation-2" icon={activeOrderPaymentItem.icon} v-on="on" disabled={printed}>-->
                <!--              <div>{activeOrderPaymentItem.text}</div>-->
                <!--            </g-btn-bs>-->
                <!--          </template>-->
                <div class="col-flex">
                  {paymentMethodMenuItems.map((item, index) =>
                      <g-btn-bs
                          class="ml-0 mr-0"
                          icon={item.icon}
                          onClick_stop={setOrderPaymentMethod(item)}
                          key={`paymentMethodMenuItems-${index}`}
                      >
                        <div>{item.text}</div>
                      </g-btn-bs>)}
                </div>
              </g-menu> : null}
          <g-spacer/>
          <g-btn-bs width="120" background-color="#0EA76F" icon="icon-complete" class="elevation-2"
                    onClick_stop="complete">
            Complete
          </g-btn-bs>
        </g-toolbar>
        <div class="receipt-main">
          <div class="receipt-main__header">
            <div class="receipt-main__header-title">{store.name}</div>
            <div class="receipt-main__header-subtitle">{store.address}</div>
            <div class="receipt-main__header-subtitle">
              <span class="mr-3">Tel: {store.phone}</span>
              <span>VAT Reg No: {store.vat}</span>
            </div>
          </div>
          <div class="receipt-main__title">Table: {order.table}</div>
          {split ? <>
                {order.splits.map((split, i) => <>
                  <div class="receipt-main__item" key={split._id}>
                    <div class="row-flex align-items-center">
                      <g-menu v-model="menu[i]" nudge-bottom="10" content-class="menu-receipt-action">
                        // <template v-slot:activator="{ on }">
                        // <div v-on={on} class={['receipt-main__item-seat', menu[i] && 'receipt-main__item-seat--selected']}>
                        // Seat {i + 1}
                        // </div>
                        // </template>
                        <div class="menu-seat-btn">
                          <div class="menu-seat-btn--payment">
                            <g-btn-bs width="100" icon="icon-print" class="elevation-2" onClick_stop="print(split)">
                              Print
                            </g-btn-bs>
                            <g-btn-bs width="100" class="elevation-2">
                              Bewirtung
                            </g-btn-bs>
                          </div>
                          <div class="menu-seat-btn--payment">
                            <g-btn-bs width="100" icon="icon-credit_card"
                                      background-color={getPaymentColor(split.payment, 'card')}
                                      class="elevation-2" onClick_stop="savePayment(split, 'card')">
                              Card
                            </g-btn-bs>
                            <g-btn-bs width="100" icon="icon-cash"
                                      background-color={getPaymentColor(split.payment, 'cash')}
                                      class="elevation-2" onClick_stop="savePayment(split, 'cash')">
                              Cash
                            </g-btn-bs>
                            <g-btn-bs width="100" icon="icon-multi_payment" background-color={getPaymentColor(split.payment, 'multi')}
                                      class="elevation-2" onClick_stop="openMultiDialog(split)">
                              Multi
                            </g-btn-bs>
                          </div>
                          <g-btn-bs width="100" icon="icon-email" class="elevation-2">
                            Email
                          </g-btn-bs>
                          <g-btn-bs width="100" icon="icon-coin-box" class="elevation-2" onClick_stop="showTipDialog(split)">
                            Trinkgeld
                          </g-btn-bs>
                        </div>
                      </g-menu>

                      <g-spacer/>
                      {split.payment.map((p, iP) =>
                          <div class="receipt-main__item-total" key={`payment_${i}_${iP}`}>
                            <g-icon class="mr-1">{getIcon(p.type)}</g-icon>
                            <span>{$t('common.currency', storeLocale)} {p.value}</span>
                          </div>)}
                      {split.tip ?
                          <div class="receipt-main__item-total">
                            <g-icon class="mr-1">{getIcon('tip')}</g-icon>
                            <span>{$t('common.currency', storeLocale)} {split.tip}</span>
                          </div> : null}
                    </div>
                    <div class="receipt-main__item-header">
                      <div class="col-1">Q.ty</div>
                      <div class="col-9 pl-2">Item name</div>
                      <div class="col-2 ta-right">Total</div>
                    </div>
                    {split.items.map((item, j) =>
                        <div class="receipt-main__item-row" key={`item_${i}_${j}`}>
                          <div class="col-1">{item.quantity}</div>
                          <div class="col-9 pl-2">
                            <div>{item.name}</div>
                            {(item.modifiers && item.modifiers.length) ?
                                <div class="receipt-main__item-row__modifier">
                                  {formatModifiers(item)}
                                </div> : null}
                          </div>
                          <div class="col-2 ta-right">{$filters.formatCurrency(getProductTotal(item))}</div>
                        </div>)}
                  </div>
                </>)}
              </> :
              <div class="receipt-main__item">
                <div class="row-flex align-items-center">
                  <g-spacer/>
                  {order.payment.map((p, iP) =>
                      <div class="receipt-main__item-total" key={`payment_${iP}`}>
                        <g-icon class="mr-1">{getIcon(p.type)}</g-icon>
                        <span>{$t('common.currency', storeLocale)} {p.value}</span>
                      </div>)}
                </div>
                <div class="receipt-main__item-header">
                  <div class="col-1">Q.ty</div>
                  <div class="col-9">Item name</div>
                  <div class="col-2 ta-right">Total</div>
                </div>
                {orderItems.map(item =>
                    <div class="receipt-main__item-row" key={item._id.toString()}>
                      <div class="col-1">{item.quantity}</div>
                      <div class="col-9">
                        <div>{item.name}</div>
                        {(item.modifiers && item.modifiers.length) ?
                            <div class="receipt-main__item-row__modifier">
                              {formatModifiers(item)}
                            </div> : null}
                      </div>
                      <div class="col-2 ta-right">{$filters.formatCurrency(getProductTotal(item))}</div>
                    </div>)}
              </div>}
        </div>
      </div>
      <div class="blur-overlay" v-show="blurReceipt"/>

      <dialog-multi-payment
          rotate
          v-model="dialog.multi"
          store-locale={storeLocale}
          total={split ? tempSplit.vSum : total}
          onSubmit="saveMultiPayment"/>

      <dialog-form-input
          width="40%"
          v-model="dialog.tip"
          keyboard-type="numeric"
          onSubmit="saveTip"
          keyboard-width="100%"
          rotate>
        <!--        <template #input>-->
        <!--        <pos-textfield-new-->
        <!--            ref="tip-textfield"-->
        <!--            label="Card Payment"-->
        <!--            v-model="tipEditValue"-->
        <!--            clearable/>-->
        <!--      </template>-->
      </dialog-form-input>
    </g-dialog>
  }
</script>
<style scoped lang="scss">
.blur-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7);
}

.receipt {
  transform: rotate(-90deg);
  transform-origin: left top;
  width: 100vh;
  height: 100vw !important;
  position: absolute;
  top: 100%;
  left: 0;
  display: flex;
  flex-direction: column;

  .g-toolbar {
    flex: 0 0 64px !important;
  }

  &-main {
    padding: 32px;
    background-color: white;
    flex: 1;
    overflow: scroll;

    &__header {
      margin-bottom: 32px;
      text-align: center;

      &-title {
        font-size: 20px;
        font-weight: 700;
      }

      &-subtitle {
        font-size: 12px;
        line-height: 14px;
      }
    }

    &__title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    &__item {
      margin-bottom: 36px;

      &-seat {
        width: 100px;
        height: 36px;
        line-height: 36px;
        font-weight: 700;
        background: #FFFFFF;
        border: 1px solid #D0D0D0;
        border-radius: 2px;
        text-align: center;

        &--selected {
          border-color: #1271FF;
          background: #E3F2FD;
        }
      }

      &-total {
        font-weight: 700;
        margin-left: 4px;
        padding: 0 4px;

        & + .receipt-main__item-total {
          border-left: 1px solid black;
        }
      }

      &-header {
        display: flex;
        align-items: center;
        border-top: 1px dashed black;
        border-bottom: 1px dashed black;
        margin: 12px 0 4px;
        padding: 4px 0;
        font-weight: 700;
      }

      &-row {
        display: flex;
        align-items: center;
        padding: 4px 0;

        &__modifier {
          font-style: italic;
          font-size: 12px;
        }
      }
    }
  }
}

.g-btn-bs {
  font-size: 14px;
  background-color: white;
}

.menu-seat-btn {
  display: flex;
  align-items: flex-start;
  padding: 8px;
  background-color: white;

  &--payment {
    display: flex;
    flex-direction: column;

    .g-btn-bs:nth-child(2) {
      margin-top: 8px;
      margin-bottom: 8px;
    }
  }
}

@media screen and (max-height: 599px) {
  .g-toolbar {
    .g-btn-bs {
      width: auto !important;
      font-size: 0;

      ::v-deep .g-icon {
        margin-right: 0 !important;
      }
    }
  }

  .receipt-main__item-header {
    font-size: 14px;
  }

  .menu-seat-btn {
    flex-direction: column;

    .g-btn-bs {
      margin-bottom: 8px;
      margin-left: 0;
    }

    &--payment {
      flex-direction: row;
    }
  }
}
</style>

<style lang="scss">
.menu-receipt-action {
  transform: rotate(-90deg) translateX(calc(-100% + 16px)) translateY(40px);
  transform-origin: left top;
}

.menu-payment-option {
  transform: rotate(-90deg) translateY(40px);
  transform-origin: left top;
}
</style>
