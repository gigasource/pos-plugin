<template>
  <g-dialog v-model="internalValue" width="50%">
    <g-card :class="['dialog-multi-payment', rotate && 'rotate']">
      <div class="dialog-multi-payment__header">
        <span class="dialog-multi-payment__header-title">Multi Payment</span>
        <g-spacer/>
        <span class="mr-1">Total:</span>
        <span class="dialog-multi-payment__header-number">
          {{$t('common.currency', storeLocale)}} {{total}}
        </span>
      </div>
      <div class="dialog-multi-payment__screen">
        <template v-for="item in listPayments">
          <div class="mt-1 mb-2 row-flex align-items-center">
            <g-btn-bs :background-color="getBackgroundColor(item)" border-radius="2px"
                      style="border: 1px solid #bdbdbd"
                      @click="click(`${item.type}-textfield`)">
              <g-icon v-if="item.icon" size="20">{{item.icon}}</g-icon>
              <span class="ml-2" style="text-transform: capitalize">{{ item.type }}</span>
            </g-btn-bs>
            <pos-textfield-new clearable v-if="item.type === 'card'" ref="card-textfield"
                               v-model="cardEditValue" @click.stop="getRemainingValue"/>
            <pos-textfield-new clearable v-else ref="cash-textfield"
                               v-model="cashEditValue" @click.stop="getRemainingValue"/>
          </div>
        </template>
      </div>
      <div class="dialog-multi-payment__screen--mobile">
        <g-text-field clearable ref="card-textfield" outlined :label="$t('payment.cash')" class="mr-1"
                      v-model="cardEditValue" @click.stop="getRemainingValue">
          <template v-slot:prepend-inner>
            <g-icon>icon-cash</g-icon>
          </template>
        </g-text-field>
        <g-text-field clearable ref="cash-textfield" outlined :label="$t('payment.card')"
                           v-model="cashEditValue" @click.stop="getRemainingValue">
          <template v-slot:prepend-inner>
            <g-icon>icon-credit_card</g-icon>
          </template>
        </g-text-field>
      </div>
      <div class="dialog-multi-payment__keyboard">
        <pos-keyboard-full
            style="grid-area: 1 / 1 / 5 / 4"
            :template="keyboardTemplate"
            :items="keyboardItems"/>
      </div>
      <g-btn-bs background-color="#2979ff" text-color="#fff" class="w-100" :disabled="disableConfirmMulti"
                @click.stop="submit">
        Confirm
      </g-btn-bs>
    </g-card>
  </g-dialog>
</template>

<script>
  import { nextTick } from 'vue';
  import PosKeyboardFull from '../pos-shared-components/PosKeyboardFull';

  export default {
    name: 'dialogMultiPayment',
    components: {PosKeyboardFull},
    props: {
      modelValue: Boolean,
      total: [Number, String],
      storeLocale: String,
      cardValue: [Number, String],
      cashValue: [Number, String],
      rotate: Boolean,
    },
    data() {
      return {
        keyboardTemplate: 'grid-template-areas: " key7 key7 key8 key8 key9 key9" ' +
          '"key4 key4 key5 key5 key6 key6" ' +
          '"key1 key1 key2 key2 key3 key3" ' +
          '"keyDot keyDot key0 key0 del del";' +
          'grid-auto-columns: 1fr; grid-gap: 10px',
        keyboardItems: [
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
          },
        ],
        listPayments: [
          { type: 'cash', icon: 'icon-cash' },
          { type: 'card', icon: 'icon-credit_card' },
        ],
        cashEditValue: '',
        cardEditValue: '',
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.modelValue
        },
        set(val) {
          this.$emit('update:modelValue', val)
        }
      },
      disableConfirmMulti() {
        const number = (+this.cashEditValue) + (+this.cardEditValue);
        return isNaN(+this.cashEditValue) ||
          isNaN(+this.cardEditValue) ||
          number < this.total
      }
    },
    methods: {
      getRemainingValue() {
        if (this.cashEditValue && this.cardEditValue) return 0
        if (+this.cashEditValue > this.total || +this.cardEditValue > this.total) return 0
        if (this.cashEditValue && !isNaN(+this.cashEditValue)) return this.cardEditValue = this.total - (+this.cashEditValue)
        if (this.cardEditValue && !isNaN(+this.cardEditValue)) this.cashEditValue = this.total - (+this.cardEditValue)
      },
      submit() {
        this.$emit('submit', {
          card: +this.cardEditValue,
          cash: +this.cashEditValue,
        })
      },
      click(ref) {
        this.$refs[ref] && this.$refs[ref].$el.click()
      },
      getBackgroundColor(item) {
        switch (item.type) {
          case 'cash':
            return this.cashEditValue > 0 ? '#2979ff' : '#fff'
          case 'card':
            return this.cardEditValue > 0 ? '#2979ff' : '#fff'
          default:
            return '#fff'
        }
      }
    },
    watch: {
      modelValue(val) {
        if (val) {
          this.cashEditValue = this.cashValue ? '' + this.cashValue : '';
          this.cardEditValue = this.cardValue ? '' + this.cardValue : '';

          setTimeout(() => {
            nextTick(() => this.click('cash-textfield'))
          }, 1000)
        }
      }
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
