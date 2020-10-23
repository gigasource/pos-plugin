<template>
  <g-dialog v-model="internalValue" width="60%">
    <g-card>
      <g-tabs vertical :items="tabs" v-model="tab" active-text-color="#1471FF" slider-color="#1471FF">
        <g-tab-item :item="tabs[0]">
          <pos-textfield-new class="mb-5 mt-4" label="Value" placeholder="Voucher value" v-model="voucherValue" :ref="tabs[0].ref"/>
          <div class="row-flex justify-center">
            <pos-keyboard-full class="keyboard" width="100%" type="numeric" @enter-pressed="submit(true)"/>
          </div>
        </g-tab-item>
        <g-tab-item :item="tabs[1]">
          <pos-textfield-new class="mb-5 mt-4" label="Value" placeholder="Voucher value" v-model="voucherValue" :ref="tabs[1].ref"/>
          <div class="row-flex justify-center">
            <pos-keyboard-full class="keyboard" width="100%" type="numeric" @enter-pressed="submit(false)"/>
          </div>
        </g-tab-item>
      </g-tabs>
    </g-card>
  </g-dialog>
</template>

<script>
  export default {
    name: 'PosOrderVoucherDialog',
    props: {
      value: Boolean
    },
    data() {
      return {
        tabs: [{ title: 'Create Voucher', ref: 'createTf' }, { title: 'Redeem Voucher', ref: 'redeemTf' }],
        tab: null,
        voucherValue: ''
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
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
    max-width: 600px;
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
</style>
