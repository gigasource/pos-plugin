<script>
import { useI18n } from 'vue-i18n';
import { internalValueFactory, VModel_number } from '../../utils'
import { computed, ref } from 'vue';
import { onCLick_Stop } from '../../../utils/helpers';
import { getCurrentOrder } from '../pos-logic-be';

export default {
  name: 'dialogMultiPayment2',
  setup(props, { emit }) {
    const { t, locale } = useI18n()
    const currentOrder = getCurrentOrder()
    const internalValue = internalValueFactory(props, { emit })
    const {  rotate } = props
    const keyboardTemplate = ref('grid-template-areas: " key7 key7 key8 key8 key9 key9" ' +
        '"key4 key4 key5 key5 key6 key6" ' +
        '"key1 key1 key2 key2 key3 key3" ' +
        '"keyDot keyDot key0 key0 del del";' +
        'grid-auto-columns: 1fr; grid-gap: 10px')
    const keyboardItems = ref([
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
    ])

    const defaultPaymentList = ref([
      { type: 'cash', icon: 'icon-cash' },
      { type: 'card', icon: 'icon-credit_card' },
    ])
    const cashEditValue = ref('')
    const cardEditValue = ref('')

    const cardTextfieldRef = ref(null)
    const cashTextfieldRef = ref(null)
    const refs = {
      'cash-textfield': cashTextfieldRef,
      'card-textfield': cardTextfieldRef
    }

    const disableConfirmMulti = computed(() => {
      const number = (+cashEditValue.value) + (+cardEditValue.value);
      return isNaN(+cashEditValue.value) ||
          isNaN(+cardEditValue.value) ||
          number < currentOrder.vSum
    })

    const getRemainingValue = function () {
      if (cashEditValue.value && cardEditValue.value) return 0
      if (+cashEditValue.value > currentOrder.vSum || +cardEditValue.value > currentOrder.vSum) return 0
      console.log(cashEditValue.value)
      if (cashEditValue.value && !isNaN(+cashEditValue.value)) return cardEditValue.value = currentOrder.vSum - (+cashEditValue.value)
      if (cardEditValue.value && !isNaN(+cardEditValue.value)) cashEditValue.value = currentOrder.vSum - (+cardEditValue.value)
    }
    const submit = function () {
      emit('submit', {
        card: +cardEditValue.value,
        cash: +cashEditValue.value,
      })
    }
    const click = function (ref) {
      refs[ref].value && refs[ref].value.$el.click()
    }

    const getBackgroundColor = function (item) {
      switch (item.type) {
        case 'cash':
          return cashEditValue.value > 0 ? '#2979ff' : '#fff'
        case 'card':
          return cardEditValue.value > 0 ? '#2979ff' : '#fff'
        default:
          return '#fff'
      }
    }


    return () => <g-dialog v-model={internalValue.value} width="50%">
      <g-card class={["dialog-multi-payment", rotate && "rotate"]}>
        <div class="dialog-multi-payment__header">
          <span class="dialog-multi-payment__header-title">Multi Payment</span>
          <g-spacer/>
          <span class="mr-1">Total:</span>
          <span class="dialog-multi-payment__header-number">
            {t('common.currency', locale.value)} {currentOrder.vSum}
          </span>
        </div>
        <div class="dialog-multi-payment__screen">
          {defaultPaymentList.value.map(item =>
              <div class="mt-1 mb-2 row-flex align-items-center">
                <g-btn-bs backgroundColor={getBackgroundColor(item)} border-radius="2px"
                          style="border: 1px solid #bdbdbd"
                          onClick={() => click(`${item.type}-textfield`)}>
                  {item.icon && <g-icon size="20">{item.icon}</g-icon>}
                  <span class="ml-2" style="text-transform: capitalize">{item.type}</span>
                </g-btn-bs>
                {item.type === "card" ?
                    <pos-textfield-new clearable ref={cardTextfieldRef}
                                       v-model={VModel_number(cardEditValue).value}
                                       onClick={onCLick_Stop(getRemainingValue)}/> :
                    <pos-textfield-new clearable ref={cashTextfieldRef}
                                       v-model={VModel_number(cashEditValue).value}
                                       onClick={onCLick_Stop(getRemainingValue)}/>}
              </div>)}
        </div>
        <div class="dialog-multi-payment__screen--mobile">
          <g-text-field clearable ref={cardTextfieldRef} outlined label={t('payment.cash')} class="mr-1"
                        v-model_number={cardEditValue.value} onClick={onCLick_Stop(getRemainingValue)}>
            {{
              'prepend-inner': () => <g-icon>icon-cash</g-icon>
            }}
          </g-text-field>
          <g-text-field clearable ref={cashTextfieldRef} outlined label={t('payment.card')}
                        v-model_number={cashEditValue.value} onClick={onCLick_Stop(getRemainingValue)}>
            {{
              'prepend-inner': () => <g-icon>icon-credit_card</g-icon>
            }}
          </g-text-field>
        </div>
        <div class="dialog-multi-payment__keyboard">
          <pos-keyboard-full
              style="grid-area: 1 / 1 / 5 / 4"
              template={keyboardTemplate.value}
              items={keyboardItems.value}/>
        </div>
        <g-btn-bs background-color="#2979ff" text-color="#fff" class="w-100" disabled={disableConfirmMulti.value}
                  onClick={onCLick_Stop(submit)}>
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
