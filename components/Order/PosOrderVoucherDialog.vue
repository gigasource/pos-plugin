<template>
  <g-dialog v-model="internalValue" width="600">
    <g-card>
      <g-tabs vertical :items="tabs" v-model="tab" active-text-color="#1471FF" slider-color="#1471FF">
        <g-tab-item :item="tabs[0]">
          <pos-textfield-new class="mb-3 mt-4" :label="$t('restaurant.voucherValue')" placeholder="Voucher value" v-model="voucherValue" :ref="tabs[0].ref"/>
          <div class="row-flex justify-center">
            <pos-keyboard-full class="keyboard" width="100%" type="numeric" @enter-pressed="submit(true)"/>
          </div>
        </g-tab-item>
        <g-tab-item :item="tabs[1]">
          <pos-textfield-new class="mb-3 mt-4" :label="$t('restaurant.voucherValue')" placeholder="Voucher value" v-model="voucherValue" :ref="tabs[1].ref"/>
          <div class="row-flex justify-center">
            <pos-keyboard-full class="keyboard" width="100%" type="numeric" @enter-pressed="submit(false)"/>
          </div>
        </g-tab-item>
      </g-tabs>
    </g-card>
  </g-dialog>
</template>

<script>
  import PosKeyboardFull from '../pos-shared-components/PosKeyboardFull';
  
  export default {
    name: 'PosOrderVoucherDialog',
    components: {PosKeyboardFull},
    props: {
      modelValue: Boolean
    },
    data() {
      return {
        tabs: [{ title: this.$t('restaurant.createVoucher'), ref: 'createTf' }, { title: this.$t('restaurant.redeemVoucher'), ref: 'redeemTf' }],
        tab: null,
        voucherValue: ''
      }
    },
    emits: ['update:modelValue', 'addVoucher', 'redeemVoucher'],
    computed: {
      internalValue: {
        get() {
          return this.modelValue
        },
        set(val) {
          this.$emit('update:modelValue', val)
        }
      }
    },
    methods: {
      submit(create) {
        if (isNaN(this.voucherValue) || !this.voucherValue) return
        if (create) {
          this.$emit('addVoucher', this.voucherValue)
        } else {
          this.$emit('redeemVoucher', this.voucherValue)
        }
        this.internalValue = false
      }
    },
    watch: {
      tab: {
        handler(val) {
          if (val && this.internalValue) {
            setTimeout(() => {
              const tfComponent = this.$refs[val.ref]
              tfComponent && tfComponent.$el && tfComponent.$el.click()
            }, 500)
          }
        },
      },
      internalValue(val) {
        if (val) {
          this.tab = this.tabs[0]
          this.voucherValue = ''
        }
      }
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
