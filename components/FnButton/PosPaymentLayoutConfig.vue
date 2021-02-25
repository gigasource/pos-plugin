<template>
  <g-grid-layout :layout="layout" style="height: 100%">
    <div area="button-name">
      <pos-text-field :value="textFieldValue"
                      @input="updateButton($event, 'text'); debounceUpdate()"
                      :label="$t('fnBtn.btnName')"
                      placeholder="Fill your text">
        <template v-slot:append>
          <g-icon color="#757575">mdi-keyboard</g-icon>
        </template>
      </pos-text-field>
    </div>

    <div area="button-name-clear">
      <g-btn :uppercase="false" @click="resetSelectedButton" background-color="white" elevation="0" height="100%" text-color="red">
        <g-icon size="16" style="margin-right: 8px">fas fa-undo</g-icon>
        {{$t('fnBtn.clearBtn')}}
      </g-btn>
    </div>

    <div area="button-fn">
      <p class="title">Function</p>
      <pos-select :items="listButtonFunctions"
                  @input="updateButtonFunction"
                  clearable
                  item-text="text"
                  item-value="value"
                  :placeholder="$t('fnBtn.select')"
                  v-model="selectedFunction"
      >
      </pos-select>
    </div>

    <div area="button-fn-value">
      <pos-text-field
          :value="textFieldFunctionValue"
          @input="updateButton($event, 'buttonFunctionValue'), debounceUpdate()"
          label="Value"
          :placeholder="$t('fnBtn.fillValue')"
          v-if="isButtonSelected && !isInConfigLayoutMode && showFunctionValue"
      ></pos-text-field>
    </div>

    <div area="color">
      <p class="title">{{$t('fnBtn.color')}}</p>
      <g-grid-select :grid="false" :items="buttonColors" return-object v-model="selectedColor">
        <template #default="{toggleSelect, item, index}">
          <g-btn :key="index" :ripple="false"
                 :style="computeColorStyle(item)"
                 :uppercase="false"
                 @click="toggleSelect(item); updateButtonItems()"></g-btn>
        </template>
        <template #selected="{toggleSelect, item, index}">
          <g-badge :badge-size="12" overlay style="margin-right: 14px;">
            <template v-slot:badge>
              <g-icon>done</g-icon>
            </template>
            <g-btn :ripple="false"
                   :style=" computeSelectedColorStyle(item)"
                   :uppercase="false">
            </g-btn>
          </g-badge>
        </template>
      </g-grid-select>
    </div>

    <div area="left-layout-overlay" v-show="selectedButtons.length >= 2 || isButtonSelected === false || mergeMode || splitMode">
      <div class="left-layout-overlay-info" v-show="!isButtonSelected || mergeMode || splitMode">
        <g-icon size="62" svg>icon-info-green</g-icon>
        <p class="overlay-instruction-line" v-if="!isInConfigLayoutMode && !isButtonSelected">{{$t('fnBtn.selectBtn')}}</p>
        <p class="overlay-instruction-line" v-else-if="mergeMode">{{$t('fnBtn.selectMergeBtns')}}</p>
        <p class="overlay-instruction-line" v-else="splitMode">{{$t('fnBtn.selectSplitBtn')}}</p>
      </div>
    </div>

    <div area="payment-details">
      <div class="payment-details-textfield-container">
        <div class="balance-due-textfield">
          <div class="title-holder">
            <p>{{$t('payment.balanceDue')}}</p>
            <p style="margin-left: auto">{{$t('payment.amountTendered')}}</p>
          </div>
          <div class="payment-detail-textfield"></div>
        </div>
        <div class="change-textfield">
          <div class="title-holder">
            <p>{{$t('payment.change')}}</p>
          </div>
          <div class="payment-detail-textfield"></div>
        </div>
      </div>

      <g-row>
        <g-btn v-for="item in listPayments" :uppercase="false" x-large outlined text-color="#1271ff" disabled :key="item._id"
               style="flex-basis: 30%; margin: 0 0.8em 0.8em 0">
          <img :src="item.icon" style="width: 20px; height: 20px"/>
          <span class="ml-2 text-black" style="text-transform: capitalize">{{item.name}}</span>
        </g-btn>
      </g-row>
    </div>

    <g-button-merger :items="buttonItems" :received-merge-map="mergeMap" :received-merged-buttons="mergedButtons"
                     :value="selectedButtons" @input="updateButtonItems" @merged="setMergedButtons" area="button-merger"
                     cols="1fr 1fr 1fr 1fr 1fr" ref="paymentMerger" rows="1fr 1fr 1fr 1fr 1fr" style="height: 100%; padding: 4px;">
      <template #default="{toggleSelect, item, index}">
        <g-btn :disabled="item.disabled"
               :style="computeButtonStyle(item)"
               :uppercase="false"
               @click="toggleSelect(item)"
               elevation="0" height="100%" width="100%">
          {{item.text}}
        </g-btn>
      </template>
      <template #selected="{toggleSelect, item, index}">
        <g-btn :class="activeSelectedButton"
               :style="computeSelectedButtonStyle(item)"
               :uppercase="false" @click="toggleSelect(item)"
               elevation="0" height="100%" width="100%">
          {{item.text}}
        </g-btn>
      </template>
    </g-button-merger>

    <div area="toolbar">
      <g-btn :uppercase="false" @click="$router.push({ path: '/pos-settings' })" background-color="white" class="mr-3">
        <g-icon class="mr-2" svg>icon-back</g-icon>
        <span style="color: rgba(0, 0, 0, 0.87)">{{$t('ui.back')}}</span>
      </g-btn>

      <g-menu nudge-top="5" top v-model="showMenu">
        <template v-slot:activator="{toggleContent}">
          <g-btn :uppercase="false" @click="toggleContent" background-color="white" class="mr-3" v-if="!isInConfigLayoutMode">
            <g-icon class="mr-2" svg>icon-menu</g-icon>
            <span style="color: rgba(0, 0, 0, 0.87)">{{$t('ui.more')}}</span>
          </g-btn>

          <g-btn :uppercase="false" @click="toggleMode('cancel')" background-color="white" class="mr-3" v-if="isInConfigLayoutMode">
            <g-icon class="mr-2" color="red">mdi-close-circle</g-icon>
            <span style="color: rgba(0, 0, 0, 0.87)">{{$t('ui.cancel')}}</span>
          </g-btn>
        </template>
        <div style="display: flex; flex-direction: column;">
          <g-btn :uppercase="false" @click="toggleMode('merge')">
            <g-icon style="margin-right: 5px;" svg>icon-merge</g-icon>
            {{$t('fnBtn.mergeMode')}}
          </g-btn>
          <g-btn :uppercase="false" @click="toggleMode('split')">
            <g-icon style="margin-right: 5px" svg>icon-split</g-icon>
            {{$t('fnBtn.splitMode')}}
          </g-btn>
        </div>
      </g-menu>
      <g-spacer/>
      <g-btn :disabled="selectedButtons.length <= 1" :uppercase="false" @click="onMerge" background-color="#1976D2" text-color="white" v-if="mergeMode">
        <g-icon style="margin-right: 5px;" svg>icon-merge</g-icon>
        {{$t('fnBtn.merge')}}
      </g-btn>
      <g-btn :disabled="validateSplit()" :uppercase="false" @click="onSplit" background-color="#1976D2" text-color="white" v-if="splitMode">
        <g-icon style="margin-right: 5px" svg>icon-split</g-icon>
        {{$t('fnBtn.split')}}
      </g-btn>

    </div>
  </g-grid-layout>
</template>

<script>
  import GButtonMerger from './components/GButtonMerger';
  import paymentLayout from './paymentLayout'
  import PosTextField from '../../components2/pos-shared-components/POSInput/PosTextField';
  import PosSelect from '../pos-shared-components/POSInput/PosSelect';
  import layoutConfigMixin from './common/layoutConfigMixin';

  export default {
    name: 'PosPaymentLayoutConfig',
    components: { PosSelect, PosTextField, GButtonMerger },
    injectService: ['SettingsStore:(listPayments, updatePosSettings)'],
    mixins: [layoutConfigMixin],
    data: () => ({
      layout: paymentLayout,
      buttonItems: [
        {
          col: [1, 2],
          row: [1, 2],
          style: {
            backgroundColor: null,
            textColor: null
          },
          text: '7',
          disabled: true,
        },
        {
          col: [2, 3],
          row: [1, 2],
          style: {
            backgroundColor: null,
            textColor: null
          },
          text: '8',
          disabled: true
        },
        {
          col: [3, 4],
          row: [1, 2],
          style: {
            backgroundColor: null,
            textColor: null
          },
          text: '9',
          disabled: true
        },
        {
          col: [1, 2],
          row: [2, 3],
          style: {
            backgroundColor: null,
            textColor: null
          },
          text: '4',
          disabled: true
        },
        {
          col: [2, 3],
          row: [2, 3],
          style: {
            backgroundColor: null,
            textColor: null
          },
          text: '5',
          disabled: true
        },
        {
          col: [3, 4],
          row: [2, 3],
          style: {
            backgroundColor: null,
            textColor: null
          },
          text: '6',
          disabled: true
        },
        {
          col: [1, 2],
          row: [3, 4],
          style: {
            backgroundColor: null,
            textColor: null
          },
          text: '1',
          disabled: true
        },
        {
          col: [2, 3],
          row: [3, 4],
          style: {
            backgroundColor: null,
            textColor: null
          },
          text: '2',
          disabled: true
        },
        {
          col: [3, 4],
          row: [3, 4],
          style: {
            backgroundColor: null,
            textColor: null
          },
          text: '3',
          disabled: true
        },
        {
          col: [1, 2],
          row: [4, 5],
          style: {
            backgroundColor: null,
            textColor: null
          },
          text: '0',
          disabled: true
        },
        {
          col: [2, 3],
          row: [4, 5],
          style: {
            backgroundColor: null,
            textColor: null
          },
          text: '.',
          disabled: true
        },
        {
          col: [3, 4],
          row: [4, 5],
          style: {
            backgroundColor: null,
            textColor: null
          },
          text: 'Back',
          disabled: true
        },
      ],
      listButtonFunctions: [
        { text: 'Banknote', value: 'banknote', hasValue: true },
        { text: 'Pay', value: 'pay', hasValue: false },
        { text: 'Discount', value: 'discount', hasValue: false },
        { text: 'Cashdrawer', value: 'cashDrawer', hasValue: false },
      ],
    }),
    watch: {
      selectedButtons(newVal) {
        if (!newVal[0]) {
          return
        }

        const selectedBtn = newVal[0]
        this.activeSelectedButton = 'active-selected'

        if (!this.isInConfigLayoutMode && newVal && newVal.length >= 2) {
          this.selectedButtons = [this.selectedButtons[this.selectedButtons.length - 1]];
        }

        if (selectedBtn) {
          this.textFieldValue = selectedBtn.text || '';
          this.textFieldFunctionValue = selectedBtn.buttonFunctionValue || '';
          this.selectedFunction = selectedBtn.buttonFunction || null;
        }
        if (newVal.length > 0 && selectedBtn.style && selectedBtn.style.backgroundColor) {
          this.selectedColor = this.buttonColors.find((x) => x.value === selectedBtn.style.backgroundColor);
        }

        if (newVal.length === 0 || (selectedBtn && !selectedBtn.style.backgroundColor)) {
          this.selectedColor = null;
        }
      },
    },
    computed: {
      showFunctionValue() {
        if (!this.selectedFunction || !this.listButtonFunctions) {
          return false;
        }
        const showFunctionValue = this.listButtonFunctions.filter((item) => item.value === this.selectedFunction);
        return showFunctionValue.length > 0 ? showFunctionValue[0].hasValue : false;
      },
    },
    methods: {
      resetSelectedButton() {
        if (this.selectedButtons.length !== 1) {
          return;
        }

        this.selectedColor = this.buttonColors.find((color) => color.value === '#FFFFFF');
        this.selectedFunction = null;
        this.textFieldValue = null;

        let resetButton = this.findSelectedButton(this.selectedButtons[0]);
        if (resetButton) {
          try {
            resetButton = Object.assign(resetButton, {
              style: {
                backgroundColor: '#FFFFFF',
                textColor: '#000000'
              },
              buttonFunction: null,
              buttonFunctionValue: null,
              text: ''
            });
            this.updatePosSettings(resetButton, 'paymentFunctionButtons', this.mergeMap)
          } catch (e) {
            console.log('Error updating: ', e);
          }
        }
      },
      validateSplit() {
        return this.selectedButtons[0]
          ? ((!this.mergeMap.hasOwnProperty(this.selectedButtons[0].buttonId))
            || this.selectedButtons.length !== 1)
          : true;
      },
      onMerge() {
        try {
          this.$refs.paymentMerger.mergeButtons();
        } catch (e) {
          this.activeSelectedButton = 'active-error'
          return;
        }
        this.mergeMode = false;
        this.splitMode = false;
        this.selectedButtons = []
      },
      onSplit() {
        this.$refs.paymentMerger.splitButtons();
        this.mergeMode = false;
        this.splitMode = false;
        this.selectedButtons = []
      },
      setMergedButtons(mergedButtons, mergeMap) {
        this.mergedButtons = mergedButtons;
        this.mergeMap = mergeMap
      },
      findSelectedButton(button) {
        if (!button) {
          return null;
        }

        return this.buttonItems.find((x) => x.buttonId === button.buttonId);
      },
      updateButtonItems() {
        if (!this.selectedButtons[0]) {
          return
        }

        let foundItem = this.findSelectedButton(this.selectedButtons[0]);
        if (foundItem) {
          foundItem.style = {
            ...this.selectedColor && {backgroundColor: this.selectedColor.value},
            textColor: this.selectedColor && ['#73F8F8', '#FFFFFF'].includes(this.selectedColor.value) ? '#000000' : '#FFFFFF'
          };

          try {
            this.updatePosSettings(foundItem, 'paymentFunctionButtons', this.mergeMap)
          } catch (e) {
            console.log('Error updating: ', e);
          }
        }
      },
      debounceUpdate: _.debounce(function (e) {
        this.updateButtonItems();
      }, 500),
      async refreshData() {
        this.posSettings = await this.$getService('SettingsStore:getPosSetting')();
        if (this.posSettings) {
          this.mapFetchedButtons(this.posSettings['paymentFunctionButtons'], this.buttonItems);
        }
      }
    },
    created() {
      const i18n = this.$i18n;
      const localeMessages = i18n.messages[i18n.locale] || i18n.messages[i18n.fallbackLocale]
      this.listButtonFunctions = this.listButtonFunctions.map(item => ({
        ...item,
        text: localeMessages['fnBtn']['paymentFunctions'][item.value]
      }))
    },
    async mounted() {
      await this.$getService('SettingsStore:getListPayments')()
      await this.refreshData();
      this.selectedButtons = [];
    },
    async activated() {
      await this.$getService('SettingsStore:getListPayments')()
      await this.refreshData();
      this.selectedButtons = [];

    }
  }
</script>

<style lang="scss" scoped>
  @import "common/layoutConfig";

  .payment-details-textfield-container {
    width: 100%;
    display: flex;
    height: 30%;
  }

  .overlay-instruction-line {
    margin-top: 10px;
  }

  .balance-due-textfield {
    margin-right: 8px;
    flex: 2;
  }

  .title-holder {
    display: flex;
    font-style: normal;
    font-weight: bold;
    font-size: 13px;
    line-height: 16px;
    margin-bottom: 9px;
    color: #1D1D26;
  }

  .payment-detail-textfield {
    height: 53%;
    border: 1px solid #c9c9c9;
    background-color: #F0F0F0;
    border-radius: 4px;
  }

  .change-textfield {
    flex: 1;
  }

  .payment-details {
    padding: 9px;
  }

  .button-merger {
    ::v-deep .grid-item-selector {
      .g-btn {
        font-size: 16px;
      }
    }
  }

  .button-fn {
    padding: 13px 12px 8px 13px;

    ::v-deep .g-select .g-tf-wrapper {
      margin: 8px 0 24px 0;
    }

    ::v-deep .bs-tf-wrapper {
      margin: 0;
    }
  }

  .toolbar {
    background-color: #EEEEEE;
    padding: 12px;
    position: relative;
    bottom: 0;
    display: flex;

    .g-btn {
      min-width: 0 !important;
    }
  }

  ::v-deep .right-layout {
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.252295);
  }

  .button-name-clear {
    width: 100%;
    padding: 12px;
    display: flex;
    justify-content: center;
    margin-top: 26px;
  }
</style>
