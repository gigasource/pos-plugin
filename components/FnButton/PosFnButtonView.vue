<template>
  <g-grid-layout :layout="layout" style="height: 100%">

    <div area="button-name" v-show="isButtonSelected && !isInConfigLayoutMode">
      <pos-text-field :value="textFieldValue"
                      @input="updateButton($event, 'text'); debounceUpdate()"
                      :label="$t('fnBtn.btnName')"
                      :placeholder="$t('fnBtn.fillText')">
        <template v-slot:append>
          <g-icon color="#757575">mdi-keyboard</g-icon>
        </template>
      </pos-text-field>
    </div>

    <div area="button-action">
      <g-btn :uppercase="false" @click="resetSelectedButton" background-color="white" elevation="0" height="100%" text-color="red" v-show="isButtonSelected && !isInConfigLayoutMode">
        <g-icon size="16" style="margin-right: 8px">fas fa-undo</g-icon>
        {{$t('fnBtn.clearBtn')}}
      </g-btn>
    </div>

    <div area="function" v-show="isButtonSelected && !isInConfigLayoutMode">
      <p class="title">{{$t('fnBtn.fns')}}</p>
      <pos-select :items="listButtonFunctions"
                  @input="updateButtonFunction"
                  clearable
                  item-text="text"
                  item-value="value"
                  :placeholder="$t('fnBtn.select')"
                  v-model="selectedFunction"
      >
      </pos-select>

      <dialog-fn-button-product-lookup @selectProduct="productLookup">
        <template v-slot:activator="{open, close}">
          <pos-text-field :value="buybackProductName" @click="open" :label="$t('fnBtn.buyback')" read-only v-if="selectedFunction === 'buybackProduct'">
            <template v-slot:append>
              <g-icon color="#757575" size="16px">fas fa-search</g-icon>
            </template>
          </pos-text-field>
        </template>
      </dialog-fn-button-product-lookup>

    </div>

    <div area="button-fn-value">
      <pos-text-field :rules="selectedFunction === 'discountSingleItemByPercent' ? [rules.minMax] : []"
                      @input="updateButton($event, 'buttonFunctionValue'); debounceUpdate()"
                      :label="$t('fnBtn.value')"
                      :placeholder="$t('fnBtn.fillValue')"
                      v-if="isButtonSelected && !isInConfigLayoutMode && showFunctionValue"
                      v-model.number="textFieldFunctionValue"></pos-text-field>
      <pos-text-field @input="debounceUpdate()"
                      :label="$t('fnBtn.price')"
                      :placeholder="$t('fnBtn.fillValue')"
                      style="height: fit-content; margin-top: auto;"
                      v-if="isButtonSelected && !isInConfigLayoutMode && selectedFunction === 'buybackProduct'"
                      v-model="buybackProductPrice"></pos-text-field>
    </div>

    <div area="color" v-show="isButtonSelected && !isInConfigLayoutMode">
      <p class="title">{{$t('fnBtn.color')}}</p>
      <g-grid-select :grid="false" :items="buttonColors" return-object v-model="selectedColor">
        <template #default="{toggleSelect, item, index}">
          <g-btn :key="index" :ripple="false"
                 :style="computeColorStyle(item)"
                 :uppercase="false"
                 @click="toggleSelect(item); updateButtonItems();"></g-btn>
        </template>
        <template #selected="{toggleSelect, item, index}">
          <g-badge :badge-size="12" overlay style="margin-right: 14px;">
            <template v-slot:badge>
              <g-icon>done</g-icon>
            </template>
            <g-btn :ripple="false"
                   :style="computeSelectedColorStyle(item)"
                   :uppercase="false">
              {{item.optionTitle}}
            </g-btn>
          </g-badge>
        </template>
      </g-grid-select>
    </div>

    <g-button-merger :cols="computedLeftBtnMergerCols"
                     :items="buttonGroupItems"
                     :received-merge-map="mergeMap"
                     :received-merged-buttons="mergedButtons"
                     :rows="computedLeftBtnMergerRows"
                     :style="computedLeftBtnStyles"
                     :value="selectedButtons"
                     @input="updateButtonItems"
                     @merged="setMergedButtons"
                     area="button-chooser"
                     class="pa-2"
                     ref="merger">
      <template #default="{toggleSelect, item, index}">
        <g-btn :style="computeButtonStyle(item)" :uppercase="false"
               @click="toggleSelect(item)"
               elevation="0" height="100%" width="100%">
          {{item.text}}
        </g-btn>
      </template>
      <template #selected="{toggleSelect, item, index}">
        <g-btn :class="activeSelectedButton"
               :style="computeSelectedButtonStyle(item)"
               :uppercase="false"
               @click="toggleSelect(item)"
               elevation="0" height="100%" width="100%">
          {{item.text}}
        </g-btn>
      </template>
    </g-button-merger>


    <div area="left-layout-overlay" v-show="selectedButtons.length >= 2 || isButtonSelected === false || mergeMode || splitMode">
      <div class="left-layout-overlay-info" v-show="!isButtonSelected || mergeMode || splitMode">
        <g-icon size="62" svg>icon-info-green</g-icon>
        <p style="margin-top: 10px" v-if="!isInConfigLayoutMode && !isButtonSelected">{{$t('fnBtn.selectBtn')}}</p>
        <p style="margin-top: 10px" v-else-if="mergeMode">{{$t('fnBtn.selectMergeBtns')}}</p>
        <p style="margin-top: 10px" v-else="splitMode">{{$t('fnBtn.selectSplitBtn')}}</p>
      </div>
    </div>

    <div area="button-control">
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
    <div area="menu">
      <g-btn :key="i" :uppercase="false" background-color="#fff" elevation="0"
             height="100%" text-color="#1d1d26" v-for="i in 8"></g-btn>
    </div>

    <div area="menu__overlay" class="menu-disabled">

    </div>
    <div area="main">
      <g-scroll-window :show-arrows="false" area="window">
        <g-scroll-window-item>
          <g-btn :key="index" :uppercase="false" background-color="#9F9F9F " flat height="100%" v-for="(item, index) in 28"></g-btn>
        </g-scroll-window-item>
      </g-scroll-window>

      <g-item-group area="delimeter" mandatory>
        <template v-slot:default="{ toggle, active }">
          <template v-for="(item, index) in 3" :key="index">
            <g-item>
              <g-btn></g-btn>
            </g-item>
          </template>
        </template>
      </g-item-group>
    </div>

    <div area="main__overlay" class="menu-disabled"></div>

    <div area="keyboard__overlay"></div>

    <g-number-keyboard :items="numpadItems" area="keyboard">
      <template v-slot:screen>
        <div class="number-key-show ba-thin bg-grey-lighten-3" style="height: calc(16.6667% - 4px)">
          <input class="number-key-text col-12 self-center bg-transparent fs-large-2 fw-700 pl-2" id="number_key_output" style="border: none; outline: none">
        </div>
      </template>
    </g-number-keyboard>

    <g-button-merger :items="sideButtonItems" :received-merge-map="mergeMap" :received-merged-buttons="mergedButtons" :value="selectedButtons" @input="updateButtonItems" @merged="setMergedButtons" area="buttons" cols="1fr 1fr" ref="sideMerger" rows="1fr 1fr 1fr 1fr 1fr 1fr">
      <template #default="{toggleSelect, item, index}">
        <g-btn :style="computeButtonStyle(item)"
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
  </g-grid-layout>
</template>

<script>
  import _ from 'lodash'
  import fnButtonLayout from './fnButtonLayout'
  import cms from 'cms'
  import PosTextField from '../../components2/pos-shared-components/POSInput/PosTextField';
  import DialogFnButtonProductLookup from './components/dialogFnButtonProductLookup';
  import layoutConfigMixin from './common/layoutConfigMixin';

  export default {
    name: 'PosFnButtonView',
    components: { DialogFnButtonProductLookup, PosTextField },
    injectService: ['SettingsStore:updatePosSettings'],
    mixins: [layoutConfigMixin],
    data: () => ({
      layout: fnButtonLayout,
      numberOfConfigBtn: 0,
      buybackProductName: '',
      buybackProductUnit: null,
      buybackProductPrice: null,
      selectedBuybackProduct: null,
      quickFnRows: 0,
      buttonGroupItems: [],
      sideButtonItems: [],
      listButtonFunctions: [
        { text: 'Discount single item (dialog)', value: 'discountSingleItemDialog', hasValue: false },
        { text: 'Discount single item by %', value: 'discountSingleItemByPercent', hasValue: true },
        { text: 'Discount single item by €', value: 'discountSingleItemByAmount', hasValue: true },
        { text: 'Product Lookup', value: 'productLookup', hasValue: false },
        { text: 'Change price', value: 'changePrice', hasValue: false },
        { text: 'Quick Cash', value: 'quickCash', hasValue: false },
        { text: 'Save order', value: 'saveOrder', hasValue: false },
        { text: 'Pay', value: 'pay', hasValue: false },
        { text: 'Buyback Product', value: 'buybackProduct', hasValue: false },
      ],
      numpadItems: [
        { content: ['7'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: (value, append) => (value + append), style: 'grid-area: key7; border: 1px solid #979797' },
        { content: ['8'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: (value, append) => (value + append), style: 'grid-area: key8; border: 1px solid #979797' },
        { content: ['9'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: (value, append) => (value + append), style: 'grid-area: key9; border: 1px solid #979797' },
        { content: ['4'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: (value, append) => (value + append), style: 'grid-area: key4; border: 1px solid #979797' },
        { content: ['5'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: (value, append) => (value + append), style: 'grid-area: key5; border: 1px solid #979797' },
        { content: ['6'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: (value, append) => (value + append), style: 'grid-area: key6; border: 1px solid #979797' },
        { content: ['1'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: (value, append) => (value + append), style: 'grid-area: key1; border: 1px solid #979797' },
        { content: ['2'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: (value, append) => (value + append), style: 'grid-area: key2; border: 1px solid #979797' },
        { content: ['3'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: (value, append) => (value + append), style: 'grid-area: key3; border: 1px solid #979797' },
        { content: ['0'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: (value, append) => (value + append), style: 'grid-area: key0; border: 1px solid #979797' },
        { content: ['00'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: (value, append) => (value + append), style: 'grid-area: key00; border: 1px solid #979797' },
        { content: ['x'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: (value) => value.substring(0, value.length - 1), style: 'grid-area: keyX; border: 1px solid #979797' },
        { content: ['C'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: () => '0', style: 'grid-area: keyC; border: 1px solid #979797' },
        { content: ['&crarr;'], classes: 'key-number white', type: 'enter', action: () => null, style: 'grid-area: Enter; border: 1px solid #979797; background-color: #eeeeee' }
      ],
      menuSelected: null,
      rules: {
        minMax: value => (/^\d*$/.test(value) && value <= 100) || 'Number between 0 and 100',
      }
    }),
    watch: {
      selectedButtons: function (newVal) {
        if (!newVal[0]) {
          return
        }

        const selectedBtn = newVal[0]
        this.activeSelectedButton = 'active-selected'

        if (!this.isInConfigLayoutMode && newVal && newVal.length >= 2) {
          this.selectedButtons = [this.selectedButtons[this.selectedButtons.length - 1]];
        }

        if (selectedBtn) {
          this.textFieldValue = selectedBtn.text;
          this.textFieldFunctionValue = selectedBtn.buttonFunctionValue || '';
          this.selectedFunction = selectedBtn.buttonFunction || null;
          if (selectedBtn.buyback) {
            this.buybackProductUnit = selectedBtn.buyback.unit;
            this.buybackProductPrice = selectedBtn.buyback.price;
            this.buybackProductName = selectedBtn.buyback.product.name;
          }
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
      computedLeftBtnMergerRows() {
        return `repeat(${this.quickFnRows}, 1fr)`;
      },
      computedLeftBtnMergerCols() {
        return '1fr 1fr 1fr 1fr'
      },
      computedLeftBtnStyles() {
        if (this.quickFnRows === 0) {
          return { height: 0 }
        } else if (this.quickFnRows === 1) {
          return { height: '50%', marginTop: 'auto' }
        } else {
          return { height: '100%' }
        }
      },
      showFunctionValue() {
        if (!this.selectedFunction || !this.listButtonFunctions) {
          return false;
        }
        const showFunctionValue = this.listButtonFunctions.filter((item) => item.value === this.selectedFunction);
        return showFunctionValue.length > 0 ? showFunctionValue[0].hasValue : false;
      },
      isSideMerger() {
        if (!this.selectedButtons[0]) {
          return false;
        }
        const sideButtonIndex = this.sideButtonItems.findIndex((item) => this.selectedButtons[0].buttonId === item.buttonId);
        return sideButtonIndex >= 0;
      },
      isValidForm() {
        if (this.selectedFunction === 'discountSingleItemByPercent') {
          return /^\d*$/.test(this.textFieldFunctionValue) && this.textFieldFunctionValue <= 100;
        }
        return true;
      }
    },
    methods: {
      resetSelectedButton() {
        if (this.selectedButtons[0].length < 0) {
          return;
        }
        this.selectedButtons[0] = Object.assign(this.selectedButtons[0], {
          style: {
            backgroundColor: '#FFFFFF',
            textColor: 'black'
          },
          buyback: null,
          buttonFunction: null,
          buttonFunctionValue: null,
          text: ''
        })

        this.buybackProductName = null;
        this.selectedColor = this.buttonColors.find((color) => color.value === '#FFFFFF');
        this.buybackProductUnit = null;
        this.buybackProductPrice = null;
        this.selectedFunction = null;
        this.textFieldValue = null;

        let resetButton = this.buttonGroupItems.find((item) => item.buttonId === this.selectedButtons[0].buttonId);
        if (resetButton) {
          try {
            resetButton = Object.assign(resetButton, this.selectedButtons[0]);
            this.updatePosSettings(resetButton, 'leftFunctionButtons', this.mergeMap)
          } catch (e) {
            console.log('Error updating: ', e);
          }
        }

        let resetSideButton = this.sideButtonItems.find((item) => item.buttonId === this.selectedButtons[0].buttonId);
        if (resetSideButton) {
          try {
            resetButton = Object.assign(resetSideButton, this.selectedButtons[0]);
            this.updatePosSettings(resetSideButton, 'rightFunctionButtons', this.mergeMap)
          } catch (e) {
            console.log('Error updating: ', e);
          }
        }
      },
      productLookup(product) {
        this.selectedBuybackProduct = product;
        this.buybackProductUnit = product.unit;
        this.buybackProductName = product.name;

        this.updateButton({ product, unit: product.unit, price: product.price }, 'buyback');
        this.updateButtonItems();
      },
      onMerge() {
        if (this.isSideMerger) {
          try {
            this.$refs.sideMerger.mergeButtons();
          } catch (e) {
            this.activeSelectedButton = 'active-error'
            return;
          }
        } else {
          try {
            this.$refs.merger.mergeButtons();
          } catch (e) {
            this.activeSelectedButton = 'active-error'
            return;
          }
        }
        this.mergeMode = false;
        this.splitMode = false;
        this.selectedButtons = []
      },
      onSplit() {
        if (this.isSideMerger) {
          this.$refs.sideMerger.splitButtons();
        } else {
          this.$refs.merger.splitButtons();
        }
        this.mergeMode = false;
        this.splitMode = false;
        this.selectedButtons = []
      },
      updateSelectedBtnStyle() {
        this.selectedButtons[0].style.textColor = this.selectedColor && ['#73F8F8', '#FFFFFF'].includes(this.selectedColor.value) ? '#000000' : '#FFFFFF';
        this.selectedButtons[0].style.backgroundColor = this.selectedColor && this.selectedColor.value;
        if (this.selectedButtons[0].buyback) {
          this.selectedButtons[0].buyback.price = this.buybackProductPrice;
        }
      },
      updateButtonItems() {
        if (!this.isValidForm || !this.selectedButtons.length) {
          return;
        }
        const selectedBtnId = this.selectedButtons[0].buttonId;

        let foundItem = this.buttonGroupItems.find((item) => item.buttonId === selectedBtnId);
        if (foundItem) {
          this.updateSelectedBtnStyle();
          try {
            foundItem = Object.assign(foundItem, this.selectedButtons[0]);
            this.updatePosSettings(foundItem, 'leftFunctionButtons', this.mergeMap)
          } catch (e) {
            console.log('Error updating: ', e);
          }
        }

        let foundSideItem = this.sideButtonItems.find((item) => item.buttonId === selectedBtnId);
        if (foundSideItem) {
          this.updateSelectedBtnStyle();
          try {
            foundSideItem = Object.assign(foundSideItem, this.selectedButtons[0]);
            this.updatePosSettings(foundSideItem, 'rightFunctionButtons', this.mergeMap)
          } catch (e) {
            console.log('Error updating: ', e);
          }
        }
      },
      debounceUpdate: _.debounce(function (e) {
        this.updateButtonItems();
      }, 500),
      setMergedButtons(mergedButtons, mergeMap) {
        this.mergedButtons = mergedButtons;
        this.mergeMap = mergeMap
      },
      validateSplit() {
        return this.selectedButtons[0]
          ? ((!this.$refs.merger.mergeMap.hasOwnProperty(this.selectedButtons[0].buttonId)
            && !this.$refs.sideMerger.mergeMap.hasOwnProperty(this.selectedButtons[0].buttonId))
            || this.selectedButtons.length !== 1)
          : true;
      },
      findSelectedButton(button) {
        if (!button) {
          return null;
        }

        return this.buttonGroupItems.find((x) => x.buttonId === button.buttonId) || this.sideButtonItems.find((x) => x.buttonId === button.buttonId);
      },
      async refreshData() {
        this.posSettings = await this.$getService('SettingsStore:getPosSetting')();
        if (this.posSettings) {
          this.quickFnRows = this.posSettings['generalSetting']['quickFnRows'] || 0;
          this.numberOfConfigBtn = 4 * this.quickFnRows;

          this.buttonGroupItems = [];
          this.sideButtonItems = [];

          this.mapFetchedButtons(_.slice(this.posSettings['leftFunctionButtons'], 0, this.numberOfConfigBtn), this.buttonGroupItems);
          this.mapFetchedButtons(this.posSettings['rightFunctionButtons'], this.sideButtonItems);
        }
      }
    },
    created() {
      const i18n = this.$i18n;
      const localeMessages = i18n.messages[i18n.locale] || i18n.messages[i18n.fallbackLocale]
      this.listButtonFunctions = this.listButtonFunctions.map(item => ({
        ...item,
        text: localeMessages['fnBtn']['orderFunctions'][item.value]
      }))
    },
    async mounted() {
      await this.refreshData();
      this.selectedButtons = [];
    },
    async activated() {
      await this.refreshData();
      this.selectedButtons = [];
    }
  }
</script>

<style lang="scss" scoped>
  @import "common/layoutConfig";

  .menu__overlay, .main__overlay, .keyboard__overlay {
    background-color: rgba(255, 255, 255, 0.54);
    z-index: 99;
  }

  .button-control {
    background-color: #EEEEEE;
    padding: 12px;
    position: relative;
    bottom: 0;
    display: flex;

    .g-btn {
      min-width: 0 !important;
    }
  }

  .main {
    ::v-deep .g-window {
      box-shadow: none;
    }
  }

  .button-action {
    width: 100%;
    padding: 12px;
    display: flex;
    justify-content: center;
    margin-top: 26px;
  }

  .button-chooser {
    ::v-deep .g-row .g-col {
      padding: 2.5px !important;
    }

    .g-btn {
      min-width: 0 !important;
      padding: 0 !important;
    }
  }

  .function {
    padding: 13px 12px 8px 13px;

    .g-select {
      ::v-deep .g-tf-wrapper {
        fieldset {
          .g-tf {
            .inputGroup .input .g-tf-input {
              font-size: 15px;
            }
          }
        }
      }
    }
  }

  .button-group-item {
    border: 1px solid #979797;
    height: 80% !important;
    box-shadow: none;
    margin: 5px;
  }


  .menu {
    background-color: #90CAF9;
    overflow-x: auto;
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-auto-columns: 31.25%;
    grid-gap: 6px;
    grid-auto-flow: column;
    padding: 6px;

    &::-webkit-scrollbar {
      display: none;
    }

    &__active {
      background-color: #2979FF !important;
      color: white !important;
    }

    &:after {
      content: '';
      width: 1px;
      height: 100%;
    }
  }

  .function {
    ::v-deep .g-select .g-tf-wrapper {
      margin: 8px 0 24px 0;
    }

    ::v-deep .bs-tf-wrapper {
      margin: 0;
    }
  }

  .g-btn {
    white-space: normal;

    ::v-deep .g-btn__content {
      flex: 0 1 auto;
      line-height: 0.9;
    }

    &.g-btn__outlined {
      border: 1px solid #979797;
      background-color: #fafafa;
    }

    &.g-btn__disabled {
      background-color: #DFDFDF;
    }

    &.g-btn__text {
      border: 0;
    }
  }

  .main {
    padding: 6px 6px 0 6px;
    overflow: hidden;

    ::v-deep .g-window {
      width: 100%;

      .g-window__container {
        height: 100%;
      }

      .g-window-item,
      .g-scroll-window-item {
        height: 100%;
        display: grid;
        grid-template-rows: repeat(7, 1fr);
        grid-template-columns: repeat(4, 1fr);
        grid-gap: 6px;
        margin-right: 6px;
      }
    }

    .g-item-group {
      align-items: center;
      justify-content: center;

      .g-btn {
        width: 8px !important;
        height: 8px !important;
        min-width: 0 !important;
        padding: 0 !important;
        margin: 0 6px;
        box-shadow: none;
        background-color: #E0E0E0 !important;
      }

      .g-item__active .g-btn {
        background-color: #2196F3 !important;
      }
    }
  }

  .keyboard {
    padding: 8px 0 8px 8px;
    height: 100%;

    ::v-deep .keyboard__template {
      grid-template-rows: repeat(5, calc(20% - 3.67px))!important;
    }
  }

  .buttons {
    padding: 8px 8px 8px 0;

    .g-btn {
      padding: 0 !important;
    }
  }
</style>
