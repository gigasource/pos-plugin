<script>
import {useI18n} from 'vue-i18n';
import {genScopeId, internalValueFactory, parseNumber, VModel_number} from '../../utils';
import {ref, watch} from 'vue'
import ScrollSelect from "../../Reservation/ScrollSelect";


export default {
  name: 'DiscountInput2',
  components: {ScrollSelect},
  props: {
    type: String,
    modelValue: null,
    percent: Number,
    hooks: Function
  },
  setup(props, {emit}) {
    const {t, locale} = useI18n();
    const percent = ref(0)
    const amount = ref(0)
    const custom = ref(0)

    props.hooks && props.hooks.on('init', (_percent, value) => {
      let _amount = 0, _custom = 0;
      if (_percent === undefined) {
        if (listAmount.includes(value)) {
          _amount = value;
        } else if (value !== undefined) {
          _custom = value;
        }
      }
      percent.value = _percent || 0;
      amount.value = _amount;
      custom.value = _custom;
    })

    const listPercent = [5, 10, 15, 20, 25, 30, 40, 50]
    const listAmount = [1, 2, 5, 10, 15, 20, 30, 50]
    let quickDiscountJSonData = localStorage.getItem('QuickDiscount')
    const quickDiscount = ref(quickDiscountJSonData ? JSON.parse(quickDiscountJSonData) : [])

    function selectPercent(_percent) {
      if (_percent) {
        percent.value = parseNumber(_percent)
        amount.value = 0
        custom.value = 0
      }
    }

    function selectAmount(_amount) {
      if (_amount) {
        amount.value = parseNumber(_amount)
        percent.value = 0
        custom.value = 0
      }
    }

    function selectDiscount(discount) {
      custom.value = parseNumber(discount)
    }

    function removeQuickDiscount(index) {
      if (custom.value === quickDiscount.value[index]) {
        custom.value = 0
      }
      quickDiscount.value.splice(index, 1)
      localStorage.setItem('QuickDiscount', JSON.stringify(quickDiscount.value))
    }

    function removeDiscount() {
      [percent.value, amount.value, custom.value] = [0, 0, 0];
      emit('remove-discount')
    }

    function submit() {
      let value = percent.value || amount.value || custom.value || 0
      if (custom.value && quickDiscount.value.findIndex(discount => discount === custom.value) === -1 && !listAmount.includes(custom.value)) {
        if (quickDiscount.value.length === 5) { // max 5 recent items
          quickDiscount.value.shift()
        }
        quickDiscount.value.push(custom.value)
        localStorage.setItem('QuickDiscount', JSON.stringify(quickDiscount.value))
      }
      emit('submit', {
        type: percent.value ? 'percentage' : 'amount',
        value
      })
    }

    watch(() => custom.value, (newV) => {
      if (newV) {
        amount.value = 0
        percent.value = 0
      }
    })

    const _render = genScopeId(() =>
        <div class="discount h-100">
          <div class="discount-content">
            <div class="w-10 mx-2">
              <div class="fw-700 ta-center fs-small">
                {t('discount.percent')} (%)
              </div>
              <scroll-select key={'s1'}
                             modelValue={percent.value}
                             items={listPercent}
                             height={200}
                             class={percent.value && 'scroll--selected'}
                             itemHeight={40} selected-color="#1271FF"
                             onUpdate:modelValue={selectPercent}>
              </scroll-select>
            </div>
            <div class="w-10 mx-2">
              <div class="fw-700 ta-center fs-small">
                {t('discount.amount')} ({t('common.currency', locale.value)})
              </div>
              <scroll-select key={'s2'}
                             modelValue={amount.value}
                             items={listAmount}
                             height={200}
                             class={amount.value && 'scroll--selected'}
                             itemHeight={40} selected-color="#1271FF"
                             onUpdate:modelValue={selectAmount}>
              </scroll-select>
            </div>
            <div class="flex-grow-1 ml-3">
              <div class="fw-700 ml-1">
                {t('discount.discount')} </div>
              <pos-textfield-new label={`${t('discount.custom')} (${t('common.currency', locale.value)})`}
                                 v-model={VModel_number(custom, 'value').value}>
              </pos-textfield-new>
              <div class="fw-700 fs-small ml-1 mb-1">
                {t('discount.quickDiscount')} </div>
              <div class="discount-quick">
                {quickDiscount.value.map((discount, i) =>
                    <div key={i} onClick={() => selectDiscount(discount)}
                         class={['discount-quick__item', custom.value === +discount && 'discount-quick__item--selected']}>
                      <span>{t('common.currency', locale.value)} {discount} </span>

                    </div>
                )}
              </div>
              {
                (percent.value || amount.value || custom.value) ?
                    <g-btn-bs background-color="#ff4452" icon="icon-delete2" onClick={removeDiscount}>
                      Remove discount </g-btn-bs>
                    : null
              }
            </div>
          </div>
          <div class="discount-keyboard">
            <pos-keyboard-full type="numeric" onEnterPressed={submit}>
            </pos-keyboard-full>
          </div>
        </div>)
    return {
      _render,
      percent,
      custom,
      amount
    }
  },
  render() {
    return this._render();
  }
}
</script>


<style scoped lang="scss">
.discount {
  background: white;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;

  &-content {
    flex: 1;
    display: flex;
    padding: 6px;

    .scroll-select__wrapper ::v-deep {

      .scroll-select__container--item {
        color: #1d1d2680;
      }

      .selected {
        left: 0;
        right: 0;
        width: auto;

        &--item {
          box-shadow: 0 0 4px 0 #1271FF;
        }
      }
    }

    .scroll--selected ::v-deep .scroll-select__container--item {
      color: #1d1d26;
    }
  }

  &-quick {
    display: flex;
    margin-left: 4px;

    &__item {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      margin-right: 4px;
      margin-bottom: 8px;
      background-color: #F6F6F6;
      border: 0.5px solid #7D7D7D;
      border-radius: 4px;
      min-width: 60px;

      &--selected {
        background-color: #1271FF;
        color: white;
        border-color: #1271FF;
      }
    }
  }

  &-keyboard {
    flex: 0 0 35%;
    padding: 6px;
    background: #f0f0f0;

    ::v-deep .key {
      font-size: 16px;
    }
  }
}

@media screen and (min-height: 600px) {
  .discount {
    &-keyboard {
      ::v-deep .key {
        font-size: 20px;
      }
    }
  }
}
</style>
