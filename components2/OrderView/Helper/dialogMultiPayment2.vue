<script>
export default {
  setup() {
    return () => <g-dialog v-model={internalValue} width="50%">
      <g-card class={['dialog-multi-payment', rotate && 'rotate']}>
        <div class="dialog-multi-payment__header">
          <span class="dialog-multi-payment__header-title">Multi Payment</span>
          <g-spacer/>
          <span class="mr-1">Total:</span>
          <span class="dialog-multi-payment__header-number">
            {$t('common.currency', storeLocale)} {total}
          </span>
        </div>
        <div class="dialog-multi-payment__screen">
          {listPayments.map(item =>
              <div class="mt-1 mb-2 row-flex align-items-center">
                <g-btn-bs backgroundColor={getBackgroundColor(item)} border-radius="2px"
                          style="border: 1px solid #bdbdbd"
                          onClick={click(`${item.type}-textfield`)}>
                  {item.icon && <g-icon size="20">{item.icon}</g-icon>}
                  <span class="ml-2" style="text-transform: capitalize">{item.type}</span>
                </g-btn-bs>
                {item.type === 'card' ?
                    <pos-textfield-new clearable ref="card-textfield"
                                       v-model={cardEditValue} onClick_stop={getRemainingValue}/> :
                    <pos-textfield-new clearable ref="cash-textfield"
                                       v-model={cashEditValue} onClick_stop={getRemainingValue}/>}
              </div>)}
        </div>
        <div class="dialog-multi-payment__screen--mobile">
          <g-text-field clearable ref="card-textfield" outlined label={$t('payment.cash')} class="mr-1"
                        v-model={cardEditValue} onClick_stop={getRemainingValue}>
            {{
              'prepend-inner': () => <g-icon>icon-cash</g-icon>
            }}
          </g-text-field>
          <g-text-field clearable ref="cash-textfield" outlined label={$t('payment.card')}
                        v-model={cashEditValue} onClick_stop={getRemainingValue}>
            {{
              'prepend-inner': () => <g-icon>icon-credit_card</g-icon>
            }}
          </g-text-field>
        </div>
        <div class="dialog-multi-payment__keyboard">
          <pos-keyboard-full
              style="grid-area: 1 / 1 / 5 / 4"
              template={keyboardTemplate}
              items={keyboardItems}/>
        </div>
        <g-btn-bs background-color="#2979ff" text-color="#fff" class="w-100" disabled={disableConfirmMulti}
                  onClick_stop={submit}>
          Confirm
        </g-btn-bs>
      </g-card>
    </g-dialog>
  }
}
</script>

<style scoped lang="scss">
::v-deep .key {
  border: 1px solid #BDBDBD;
  border-radius: 2px;
  font-size: 24px;
  font-weight: 700;
  box-shadow: unset;
  padding-top: 16px;
  padding-bottom: 16px;
}

.g-btn-bs {
  margin: 0;
  flex-basis: 40%;
  height: 50px;
}

.g-tf-wrapper {
  margin-bottom: 0;
  margin-top: 0;
  margin-right: 0;
}

.bs-tf-wrapper {
  margin-bottom: 0;
  margin-top: 0;
  margin-right: 0;

  .bs-tf-inner-input-group {
    border-radius: 2px;
  }
}

.dialog-multi-payment {
  display: flex;
  flex-direction: column;
  padding: 16px;

  &__header {
    display: flex;
    align-items: center;

    &-title {
      font-size: 20px;
      font-weight: 700;
    }

    &-number {
      font-size: 18px;
      font-weight: 700;
      color: #1271FF;
    }
  }

  &__screen {
    display: block;

    &--mobile {
      display: none;
    }
  }

  &__keyboard {
    margin: 16px 0;
  }
}

.rotate {
  width: 400px;
  height: 580px !important;
  transform: rotate(-90deg) translateX(-100%);
  transform-origin: left top;
}

@media screen and (max-height: 599px) {
  .dialog-multi-payment {
    padding: 8px;

    &__header {
      font-size: 14px;

      &-title {
        font-size: 16px;
      }

      &-number {
        font-size: 14px;
      }
    }

    &__screen {
      display: none;

      &--mobile {
        display: flex;

        .g-tf-wrapper {
          margin-top: 8px;

          ::v-deep fieldset {
            border-color: #ced4da;
          }

          &.g-tf__focused ::v-deep fieldset {
            border-color: #1867c0;
          }
        }
      }
    }

    &__keyboard {
      margin: 8px 0;

      ::v-deep .keyboard__template {
        grid-gap: 5px !important;

        .key {
          font-size: 16px;
          padding: 8px;
        }
      }
    }
  }
}
</style>

<style lang="scss">

</style>
