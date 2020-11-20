<template>
  <div class="wrapper">
    <div class="col-5 px-3">
      <div class="row-flex align-items-center justify-between">
        <span>{{$t('settings.companyBarcode')}}</span>
        <g-switch v-model="barcode"/>
      </div>
      <div class="row-flex align-items-center justify-between">
        <span>{{$t('settings.showFav')}}</span>
        <g-switch v-model="favoriteArticle"/>
      </div>
      <div class="row-flex align-items-center justify-between">
        <span>{{$t('settings.autoCashdrawer')}}</span>
        <g-switch v-model="automaticCashdrawer"/>
      </div>
      <div class="row-flex align-items-center justify-between">
        <span>Quick pay/print button</span>
        <g-switch v-model="quickBtn"/>
      </div>
      <div class="row-flex align-items-center justify-between">
        <span>Only checkout printed items</span>
        <g-switch v-model="onlyCheckoutPrintedItems"/>
      </div>
      <div class="row-flex align-items-center justify-between">
        <span>Using virtual printer</span>
        <g-switch v-model="useVirtualPrinter"/>
      </div>
      <div class="row-flex align-items-center justify-between">
        <span>Pay button prints receipt</span>
        <g-switch v-model="printReceiptWithPay"/>
      </div>
      <div class="row-flex align-items-center justify-between">
        <span>Show tutorial button</span>
        <g-switch v-model="showTutorial"/>
      </div>
    </div>
    <div class="flex-grow-1 offset-1">
      <div class="row-flex align-items-center justify-center">
        <pos-time-picker :label="$t('settings.beginHour')" :value="beginHour" @input="beginHour = $event">
          <template v-slot:append>
            <g-icon>access_time</g-icon>
          </template>
        </pos-time-picker>
      </div>
      <g-select text-field-component="PosTextField" class="mt-2" :items="['tablet', 'mobile']" label="Delivery order mode" v-model="deliveryOrderMode"/>

      <div class="row-flex align-items-center justify-between">
        Google Map API Key
      </div>
      <g-text-field-bs class="google-map-api-input" v-model="googleMapApiKey">
        <template v-slot:append-inner>
          <g-icon @click="dialog.googleMapApiKey = true">icon-keyboard</g-icon>
        </template>
      </g-text-field-bs>
      <dialog-text-filter
          v-model="dialog.googleMapApiKey"
          label="Google Map API Key"
          :default-value="googleMapApiKey"
          @submit="(value) => this.googleMapApiKey = value"/>

      <div class="row-flex align-items-center justify-between">
        Quick pay button's action
      </div>
      <div class="row-flex align-items-center justify-start">
        <g-grid-select class="mt-2"
                       :items="quickPayButtonActions"
                       mandatory
                       :grid="false"
                       v-model="quickBtnAction">
          <template #default="{ toggleSelect, item }">
            <g-btn class="mx-1 mb-1" @click="toggleSelect(item)" :disabled="item === 'auto'">{{ item }}</g-btn>
          </template>
          <template #selected="{ toggleSelect, item }">
            <g-btn class="mx-1 mb-1" @click="toggleSelect(item)" background-color="blue" text-color="white">
              {{ item }}
            </g-btn>
          </template>
        </g-grid-select>
      </div>

    </div>
  </div>
</template>

<script>
  import PosTimePicker from '../../pos-shared-components/POSInput/PosTimePicker';

  export default {
    name: 'viewGeneral',
    injectService: ['PosStore:(showVirtualPrinterSidebarItem,hideVirtualPrinterSidebarItem)'],
    components: { PosTimePicker },
    data() {
      return {
        generalSettings: {},
        quickPayButtonActions: ['auto', 'pay', 'receipt'],
        dialog: {
          googleMapApiKey: false,
        },
      };
    },
    computed: {
      barcode: {
        get() {
          if (this.generalSettings) {
            return this.generalSettings.barcode;
          }
        },
        set(val) {
          this.$set(this.generalSettings, 'barcode', val)
        }
      },
      favoriteArticle: {
        get() {
          if (this.generalSettings) {
            return this.generalSettings.favoriteArticle;
          }
        },
        set(val) {
          this.$set(this.generalSettings, 'favoriteArticle', val)
        }
      },
      virtualKeyboard: {
        get() {
          if (this.generalSettings) {
            return this.generalSettings.virtualKeyboard;
          }
        },
        set(val) {
          this.$set(this.generalSettings, 'virtualKeyboard', val)
        }
      },
      automaticCashdrawer: {
        get() {
          if (this.generalSettings) {
            return this.generalSettings.automaticCashdrawer;
          }
        },
        set(val) {
          this.$set(this.generalSettings, 'automaticCashdrawer', val)
        }
      },
      quickFnRows: {
        get() {
          if (this.generalSettings) {
            return this.generalSettings.quickFnRows;
          }
        },
        set(val) {
          this.$set(this.generalSettings, 'quickFnRows', val)
        }
      },
      beginHour: {
        get() {
          return (this.generalSettings && this.generalSettings.beginHour) || '00:00'
        },
        set(val) {
          this.$set(this.generalSettings, 'beginHour', val)
        }
      },
      printReceiptWithPay: {
        get() {
          return (this.generalSettings && this.generalSettings.printReceiptWithPay)
        },
        set(val) {
          this.$set(this.generalSettings, 'printReceiptWithPay', val)
        }
      },
      quickBtn: {
        get() {
          return (this.generalSettings && this.generalSettings.quickBtn)
        },
        set(val) {
          this.$set(this.generalSettings, 'quickBtn', val)
        }
      },
      quickBtnAction: {
        get() {
          return (this.generalSettings && this.generalSettings.quickBtnAction) || 'pay';
        },
        set(val) {
          this.$set(this.generalSettings, 'quickBtnAction', val);
        },
      },
      onlyCheckoutPrintedItems: {
        get() {
          return (this.generalSettings && this.generalSettings.onlyCheckoutPrintedItems) || 'pay';
        },
        set(val) {
          this.$set(this.generalSettings, 'onlyCheckoutPrintedItems', val);
        },
      },
      useVirtualPrinter: {
        get() {
          return (this.generalSettings && !!this.generalSettings.useVirtualPrinter)
        },
        set(val) {
          this.$set(this.generalSettings, 'useVirtualPrinter', val)
          if (val) {
            this.showVirtualPrinterSidebarItem()
          } else {
            this.hideVirtualPrinterSidebarItem()
          }
        }
      },
      deliveryOrderMode: {
        get() {
          return (this.generalSettings && this.generalSettings.deliveryOrderMode) || 'tablet';
        },
        set(val) {
          this.$set(this.generalSettings, 'deliveryOrderMode', val);
        },
      },
      googleMapApiKey: {
        get() {
          return (this.generalSettings && this.generalSettings.googleMapApiKey) || '';
        },
        set(val) {
          this.$set(this.generalSettings, 'googleMapApiKey', val);
        },
      },
      showTutorial: {
        get() {
          return (this.generalSettings && this.generalSettings.showTutorial) || false;
        },
        set(val) {
          this.$set(this.generalSettings, 'showTutorial', val);
        },
      }
    },
    async created() {
      const setting = await cms.getModel('PosSetting').findOne();
      this.generalSettings = setting.generalSetting || {};

      // backward compatibility
      if (!this.generalSettings.googleMapApiKey) {
        this.$set(this.generalSettings, 'googleMapApiKey', setting.call.googleMapApiKey);
      }
    },
    watch: {
      generalSettings: {
        async handler(val) {
          if (val) {
            const settingModel = cms.getModel('PosSetting');
            await settingModel.findOneAndUpdate({}, { generalSetting: val });
          }
        },
        deep: true
      }
    }
  }
</script>

<style scoped lang="scss">
  .wrapper {
    display: flex;
    padding: 16px;
    font-size: 13px;
    line-height: 16px;
  }

  .btn-fn-row {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: #F0F0F0;
    border: 1px solid #C9C9C9;
    border-radius: 2px;
    font-size: 13px;
    line-height: 16px;
    color: #1D1D26;
    margin-left: 8px;

    &.selected {
      border-color: #1271FF;
    }
  }

  .btn-fn-row:first-of-type {
    margin-left: 4px;
  }

  span {
    max-width: 150px;
  }

  .g-select ::v-deep {
    .bs-tf-wrapper {
      margin-left: 0;

      .input {
        color: #1d1d26;
      }
    }
  }

  .google-map-api-input {
    margin-left: 0;
    margin-right: 0;
    width: 100%;

    ::v-deep .input {
      flex: 1;
      padding-right: 12px;
    }
  }
</style>
