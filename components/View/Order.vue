<template>
  <div class="order">
    <div class="order-main">
      <pos-order-layout style="flex: 1"
          v-model:selectedCategoryLayout="selectedCategoryLayout"
          v-model:selectedProductLayout="selectedProductLayout"
          v-model:productDblClicked="productDblClicked"
          v-model:orderLayout="orderLayout"
          v-model:keyboardConfig="keyboardConfig"
          v-model:fontSize="fontSize"
          v-model:category="category"
          v-model:minimumTextRow="minimumTextRow"
          v-model:collapseBlankColumn="collapseBlankColumn"
          v-model:hideTextRow="hideTextRow"
          v-model:hideBlankColumn="hideBlankColumn"
          v-model:collapseText="collapseText"
          v-model:actionMode="actionMode"
          v-model:showOverlay="showOverlay"
          v-model:scrollableLayout="scrollableLayout"
          :is-mobile="isMobile"
          :store-locale="storeLocale"
          @addProductToOrder="addProductToOrder"
          @addModifierToProduct="addModifierToProduct"
          @getKeyboardSetting="getKeyboardSetting"
      />
      <pos-order :style="!isMobile && {flex: '0 0 25%'}"
          v-model:fontSize="fontSize"
          v-model:category="category"
          v-model:minimumTextRow="minimumTextRow"
          v-model:collapseBlankColumn="collapseBlankColumn"
          v-model:hideTextRow="hideTextRow"
          v-model:hideBlankColumn="hideBlankColumn"
          v-model:collapseText="collapseText"
          v-model:actionMode="actionMode"
          v-model:showOverlay="showOverlay"
          v-model:scrollableLayout="scrollableLayout"
          :is-mobile="isMobile"
          :store-locale="storeLocale"
          :user="user"
          :items="currentOrder.items"
          :total="paymentTotal"
          :printedOrder="printedOrder"
          :actionList="actionList"
          :isTakeAwayOrder="isTakeAwayOrder"
          @addItemQuantity="addItemQuantity"
          @removeItemQuantity="removeItemQuantity"
          @addModifierToProduct="addModifierToProduct"
          @changePrice="changePrice"
          @updateOrderTable="updateOrderTable"
          @updateOrderItems="updateOrderItems"
          @removeProductModifier="removeProductModifier"
          @updateOrderItem="updateOrderItem"
          @saveTableOrder="saveTableOrder"
          @updateCurrentOrder="updateCurrentOrder"
          @resetOrderData="resetOrderData"
          @quickCash="quickCashRestaurant"
          @openDialog="openDialog"
      />
    </div>
    <pos-quick-order-toolbar
        v-if="!isMobile"
        :currentOrder="currentOrder"
        :actionList="actionList"
        @updateCurrentOrder="updateCurrentOrder"
        @resetOrderData="resetOrderData"
        @quickCash="quickCashRestaurant"
        @saveTableOrder="saveTableOrder"
        @openDialog="openDialog"
    />
  </div>
  <pos-order-split-order
      v-model="dialog.split"
      :is-mobile="isMobile"
      :user="user"
      :store-locale="storeLocale"
      :current-order="currentOrder"
      @updateCurrentOrder="updateCurrentOrder"
      @createOrderCommit="createOrderCommit"
      @saveSplitOrder="saveSplitOrder"
      @resetOrderData="resetOrderData"
      @printOrderReport="printOrderReport"
      @updatePrintedOrder="updatePrintedOrder"
    />
  <pos-order-receipt
      v-model="dialog.receipt"
      :order="currentOrder"
      :store-locale="storeLocale"
    />
  <pos-order-move-items
      v-model="dialog.move"
      :is-mobile="isMobile"
      :user="user"
      :store-locale="storeLocale"
      :current-order="currentOrder"
      :active-orders="activeOrders"
      @moveItems="moveItems"
    />
  <pos-order-voucher-dialog
      v-model="dialog.voucher"
      @addVoucher="addVoucher"
      @redeemVoucher="redeemVoucher"
    />
</template>

<script>

import posOrder from '../posOrder/posOrder';
import posOrderLayout from '../posOrder/PosOrderLayout'
import DialogProductSearchResult from "../Order/components/dialogProductSearchResult";
import PosOrderSplitOrder from "../posOrder/PosOrderSplitOrder";
import PosOrderReceipt from "../posOrder/PosOrderReceipt";
import PosOrderMoveItems from "../posOrder/PosOrderMoveItems";
import PosOrderVoucherDialog from "../Order/PosOrderVoucherDialog";
import PosQuickOrderToolbar from '../posOrder/PosQuickOrderToolbar';

export default {
  name: 'Order',
  components: {
    posOrder,
    posOrderLayout,
    PosOrderVoucherDialog, PosOrderMoveItems, PosOrderReceipt, PosOrderSplitOrder, DialogProductSearchResult, PosQuickOrderToolbar},
  injectService: [
      'PosStore:(user, isMobile, storeLocale)',
      'OrderStore:(addProductToOrder, addModifierToProduct, currentOrder, paymentTotal, printedOrder, addItemQuantity, removeItemQuantity, moveItems, addVoucher,' +
      '            changePrice, updateOrderTable, updateOrderItems, removeProductModifier, updateOrderItem, actionList, isTakeAwayOrder, activeOrders, redeemVoucher,' +
      '            saveTableOrder, resetOrderData, updateCurrentOrder, quickCashRestaurant, createOrderCommit, saveSplitOrder, printOrderReport, updatePrintedOrder)',
      'SettingsStore:(getKeyboardSetting)'
  ],
  data() {
    return {
      orderLayout: null,
      selectedCategoryLayout: null,
      selectedProductLayout: null,
      productDblClicked: null,
      keyboardConfig: null,
      fontSize: '14px',
      category: {
        type: 'horizontal',
        size: '64px',
        singleRow: false,
        differentSize: false,
        fontSize: '13px'
      },
      minimumTextRow: true,
      collapseBlankColumn: true,
      hideTextRow: false,
      hideBlankColumn: false,
      collapseText: true,
      actionMode: 'none',
      showOverlay: true,
      scrollableLayout: true,
      //inject
      user: {},
      isMobile: null,
      storeLocale: null,
      currentOrder: {},
      paymentTotal: null,
      printedOrder: null,
      actionList: [],
      isTakeAwayOrder: null,
      activeOrders: null,
      //dialog
      dialog: {
        search: false,
        split: false,
        move: false,
        voucher: false,
        receipt: false
      }
    }
  },
  methods: {
    addProductToOrder() {
      console.error('SettingStores:addProductToOrder was not injected')
    },
    addModifierToProduct() {
      console.error('SettingStores:addModifierToProduct was not injected')
    },
    getKeyboardSetting() {
      console.error('SettingStores:getKeyboardSetting was not injected')
    },
    addItemQuantity() {
      console.error('SettingStores:addItemQuantity was not injected')
    },
    removeItemQuantity() {
      console.error('SettingStores:removeItemQuantity was not injected')
    },
    changePrice() {
      console.error('SettingStores:changePrice was not injected')
    },
    updateOrderTable() {
      console.error('SettingStores:updateOrderTable was not injected')
    },
    updateOrderItems() {
      console.error('SettingStores:updateOrderItems was not injected')
    },
    removeProductModifier() {
      console.error('SettingStores:removeProductModifier was not injected')
    },
    updateOrderItem() {
      console.error('SettingStores:updateOrderItem was not injected')
    },
    saveTableOrder() {
      console.error('SettingStores:saveTableOrder was not injected')
    },
    resetOrderData() {
      console.error('SettingStores:resetOrderData was not injected')
    },
    updateCurrentOrder() {
      console.error('SettingStores:updateCurrentOrder was not injected')
    },
    quickCashRestaurant() {
      console.error('SettingStores:quickCashRestaurant was not injected')
    },
    openDialog(name) {
      this.dialog[name] = true
    },
    createOrderCommit() {
      console.error('SettingStores:createOrderCommit was not injected')
    },
    saveSplitOrder() {
      console.error('SettingStores:saveSplitOrder was not injected')
    },
    printOrderReport() {
      console.error('SettingStores:printOrderReport was not injected')
    },
    updatePrintedOrder() {
      console.error('SettingStores:updatePrintedOrder was not injected')
    },
    moveItems() {
      console.error('SettingStores:moveItems was not injected')
    },
    addVoucher() {
      console.error('SettingStores:addVoucher was not injected')
    },
    redeemVoucher() {
      console.error('SettingStores:redeemVoucher was not injected')
    }
  }
}
</script>

<style scoped lang="scss">
  .order {
    height: 100%;
    display: flex;
    flex-direction: column;

    .order-main {
      flex: 1;
      display: flex;
    }

    .g-toolbar {
      flex: 0 1 auto;
    }
  }
</style>
