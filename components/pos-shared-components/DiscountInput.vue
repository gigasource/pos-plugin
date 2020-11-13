<template>
  <div class="discount h-100">
    <div class="discount-content">
      <div class="w-10 mx-2">
        <div class="fw-700 ta-center fs-small">{{$t('discount.percent')}} (%)</div>
        <scroll-select ref="scroll-percentage" :value="percent" :items="listPercent" :height="200"
                       :item-height="40" selected-color="#1271FF" @input="selectPercent"/>
      </div>
      <div class="w-10 mx-2">
        <div class="fw-700 ta-center fs-small">{{$t('discount.amount')}} ({{$t('common.currency', storeLocale)}})</div>
        <scroll-select ref="scroll-amount" :value="amount" :items="listAmount" :height="200" :class="amount && 'scroll--selected'"
                       :item-height="40" selected-color="#1271FF" @input="selectAmount"/>
      </div>
      <div class="flex-grow-1 ml-3">
        <div class="fw-700 ml-1">{{$t('discount.discount')}}</div>
        <pos-textfield-new :label="`${$t('discount.custom')} (${$t('common.currency', storeLocale)})`" v-model="custom"/>
        <div class="fw-700 fs-small ml-1 mb-1">{{$t('discount.quickDiscount')}}</div>
        <div class="discount-quick">
          <div v-for="(discount, i) in quickDiscount" :key="i" @click="selectDiscount(discount)"
               :class="['discount-quick__item', custom === discount && 'discount-quick__item--selected']">
            <span>{{$t('common.currency', storeLocale)}} {{discount}}</span>
          </div>
        </div>
        <g-btn-bs v-if="value" background-color="#ff4452" icon="icon-delete2" @click="removeDiscount">Remove discount</g-btn-bs>
      </div>
    </div>
    <div class="discount-keyboard">
      <pos-keyboard-full type="numeric" @enter-pressed="submit"/>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'DiscountInput',
    injectService: ['PosStore:storeLocale'],
    data() {
      return {
        percent: '',
        listPercent: [5, 10, 15, 20, 25, 30, 40, 50],
        amount: '',
        listAmount: [1, 2, 5, 10, 15, 20, 30, 50],
        custom: '',
        quickDiscount: []
      }
    },
    props: {
      type: String,
      value: null
    },
    created() {
      const quickDiscount = localStorage.getItem('QuickDiscount')
      if (quickDiscount) {
        this.quickDiscount = JSON.parse(quickDiscount)
      }
    },
    computed: {},
    watch: {
      custom(val) {
        if (val) {
          this.amount = ''
          this.percent = ''
        }
      },
      type(val) {
        if (val === 'percentage') {
          this.percent = this.value
        } else {
          if (this.listAmount.findIndex(item => item === this.value) > -1) {
            this.amount = this.value
          } else {
            this.custom = this.value
          }
        }
      },
      value: {
        handler(val) {
          if (this.type === 'percentage') {
            this.percent = val
          } else {
            if (this.listAmount.findIndex(item => item === val) > -1) {
              this.amount = val
            } else {
              this.custom = val
            }
          }
        },
        immediate: true
      },
    },
    methods: {
      selectPercent(percent) {
        if (percent) {
          this.percent = percent
          this.amount = ''
          this.custom = ''
        }
      },
      selectAmount(amount) {
        if (amount) {
          this.amount = amount
          this.percent = ''
          this.custom = ''
        }
      },
      selectDiscount(discount) {
        this.custom = discount
      },
      removeQuickDiscount(index) {
        if (this.custom === this.quickDiscount[index]) {
          this.custom = ''
        }
        this.quickDiscount.splice(index, 1)
        localStorage.setItem('QuickDiscount', JSON.stringify(this.quickDiscount))
      },
      removeDiscount() {
        this.$emit('remove-discount')
      },
      submit() {
        let value = this.percent || this.amount || this.custom || 0
        if (this.custom && this.quickDiscount.findIndex(discount => discount === this.custom) === -1) {
          if (this.quickDiscount.length === 5) { // max 10 recent items
            this.quickDiscount.shift()
          }
          this.quickDiscount.push(this.custom)
          localStorage.setItem('QuickDiscount', JSON.stringify(this.quickDiscount))
        }
        this.$emit('submit', {
          type: this.percent ? 'percentage' : 'amount',
          value
        })
      }
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
