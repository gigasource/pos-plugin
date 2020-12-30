<template>
  <div class="setting">
    <div class="checkbox-group">
      <g-checkbox color="#1271FF" :label="$t('settings.multipleKitchenPrinter')"
                  v-model="useMultiPrinterForKitchenPrinter"/>
      <g-checkbox color="#1271FF" :label="$t('settings.multipleInvoicePrinter')"
                  v-model="useMultiPrinterForInvoicePrinter"/>
      <g-checkbox color="#1271FF" :label="$t('settings.multipleEntirePrinter')"
                  v-model="useMultiPrinterForEntirePrinter"/>
      <g-checkbox color="#1271FF" :label="$t('settings.showDineInTax')"
                  v-model="showDineInTax"/>
      <g-checkbox color="#1271FF" label="Merge items after printing to kitchen"
                  v-model="mergeAfterPrint"/>
    </div>
    <div class="setting-title">{{$t('settings.entireReceiptNo')}}</div>
    <div class="row-flex flex-wrap">
      <div v-for="(number, i) in listNoEntireReceipt" :key="i"
           :class="['setting-option', number === entireReceipt && 'setting-option--selected']"
           @click="_updateNoEntireReceipt(number)">
        {{number}}
      </div>
    </div>
    <dialog-confirm-delete v-model="dialog.value" :type="dialog.label" @submit="_removeEntireReceipt"/>
  </div>
</template>

<script>
  export default {
    name: "PosPrinterSettingGeneral",
    props: {},
    injectService: ['SettingsStore:(getPrinterGeneralSetting, printerGeneralSetting, updatePrinterGeneralSetting, addEntirePrinter, removeEntirePrinter, getPosSetting, updatePosSetting, setSinglePrinter)'],
    data() {
      return {
        listNoEntireReceipt: [0, 1, 2, 3, 4],
        dialog: {
          value: false,
          label: '',
          upper: 0,
          lower: 0,
        },
        entireReceipt: null,
        showDineInTax: false
      }
    },
    computed: {
      useMultiPrinterForKitchenPrinter: {
        get() {
          if (this.printerGeneralSetting) {
            return this.printerGeneralSetting.useMultiPrinterForKitchenPrinter
          }
        },
        set(val) {
          this.printerGeneralSetting.useMultiPrinterForKitchenPrinter = val
          if (!val) this.setSinglePrinter('kitchen')
          this.changeSetting()
        }
      },
      useMultiPrinterForInvoicePrinter: {
        get() {
          if (this.printerGeneralSetting) {
            return this.printerGeneralSetting.useMultiPrinterForInvoicePrinter
          }
        },
        set(val) {
          this.printerGeneralSetting.useMultiPrinterForInvoicePrinter = val
          if (!val) this.setSinglePrinter('invoice')
          this.changeSetting()
        }
      },
      useMultiPrinterForEntirePrinter: {
        get() {
          if (this.printerGeneralSetting) {
            return this.printerGeneralSetting.useMultiPrinterForEntirePrinter
          }
        },
        set(val) {
          this.printerGeneralSetting.useMultiPrinterForEntirePrinter = val
          if (!val) this.setSinglePrinter('entire')
          this.changeSetting()
        }
      },
      mergeAfterPrint: {
        get() {
          if (this.printerGeneralSetting) {
            return this.printerGeneralSetting.mergeAfterPrint
          }
        },
        set(val) {
          this.printerGeneralSetting.mergeAfterPrint = val
          this.updatePosSetting('printerGeneralSetting.mergeAfterPrint', val)
        }
      },

    },
    methods: {
      async changeSetting() {
        await this.updatePrinterGeneralSetting()
      },
      async _updateNoEntireReceipt(number) {
        this.entireReceipt = number
        if(!this.printerGeneralSetting.entireReceipt) {
          await this.addEntirePrinter(0, this.entireReceipt)
          this.printerGeneralSetting.entireReceipt = this.entireReceipt
          await this.updatePrinterGeneralSetting()
        }
        if(this.entireReceipt > this.printerGeneralSetting.entireReceipt) {
          await this.addEntirePrinter(this.printerGeneralSetting.entireReceipt, this.entireReceipt)
          this.printerGeneralSetting.entireReceipt = this.entireReceipt
          await this.updatePrinterGeneralSetting()
        }
        if(this.entireReceipt < this.printerGeneralSetting.entireReceipt) {
          this.dialog.upper = this.printerGeneralSetting.entireReceipt
          this.dialog.lower = this.entireReceipt
          this.dialog.label = ' number of entire receipt from ' + this.dialog.upper + ' to ' + this.dialog.lower
          this.dialog.value = true
          this.entireReceipt = this.printerGeneralSetting.entireReceipt
        }
      },
      async _removeEntireReceipt() {
        this.entireReceipt = this.dialog.lower
        await this.removeEntirePrinter(this.dialog.lower, this.dialog.upper)
        this.printerGeneralSetting.entireReceipt = this.entireReceipt
        await this.updatePrinterGeneralSetting()
      },
      setSinglePrinter() {
        console.error('SettingsStore:setSinglePrinter was not injected')
      }
    },
    async created() {
      await this.getPrinterGeneralSetting()
      this.entireReceipt = this.printerGeneralSetting.entireReceipt
      const posSettings = await this.getPosSetting()
      this.showDineInTax = posSettings.showDineInTax
    },
    watch: {
      async showDineInTax(val) {
        await this.updatePosSetting('showDineInTax', val)
      }
    }
  }
</script>

<style scoped lang="scss">
  .setting {
    padding: 24px 32px;

    &-title {
      color: #1d1d26;
      font-weight: 700;
      margin: 24px 0 12px 4px;
    }

    ::v-deep .g-col {
      padding: 0;
    }

    &-option {
      padding: 2px 8px;
      text-align: center;
      font-size: 13px;
      font-style: italic;
      border-radius: 2px;
      border: 1px solid #E0E0E0;
      min-width: 50px;
      margin-right: 4px;

      &--selected {
        border-color: #90CAF9;
        background-color: #E3F2FD;
      }
    }
  }
</style>
