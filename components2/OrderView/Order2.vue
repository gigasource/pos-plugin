<template>
  <div class="order">
    <div class="order-main">
      <pos-order-layout2 style="flex: 1"
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

import PosOrder2 from "./PosOrder2";
import PosOrderLayout2 from "./PosOrderLayout2";
import PosQuickOrderToolbar2 from "./Helper/PosQuickOrderToolbar2";
import {isMobile} from "../AppSharedStates";

export default {
  name: 'Order2',
  components: {
    PosOrder2,
    PosOrderLayout2,
    PosQuickOrderToolbar2,
  },
  setup() {
    //todo: put style in components

    const render = () => (<>
      <div class="order">
        <div class="order-main">
          <pos-order-layout2 style="flex: 1"/>
          <pos-order style={!isMobile.value && {flex: '0 0 25%'}}/>
        </div>
        <pos-quick-order-toolbar
            v-if="!isMobile"
            currentOrder="currentOrder"
            actionList={actionList}
            updateCurrentOrder={updateCurrentOrder}
            resetOrderData={resetOrderData}
            quickCash={quickCashRestaurant}
            saveTableOrder={saveTableOrder}
            openDialog={openDialog}
        />
      </div>
      <pos-order-split-order
          v-model={dialog.split}
          is-mobile={isMobile}
          user={user}
          store-locale={storeLocale}
          current-order={currentOrder}
          updateCurrentOrder={updateCurrentOrder}
          createOrderCommit={createOrderCommit}
          saveSplitOrder={saveSplitOrder}
          resetOrderData={resetOrderData}
          printOrderReport={printOrderReport}
          updatePrintedOrder={updatePrintedOrder}
      />
      <pos-order-receipt
          v-model={dialog.receipt}
      />
      <pos-order-move-items
          v-model={dialog.move}
          user={user}
          current-order={currentOrder}
          active-orders={activeOrders}
          moveItems={moveItems}
      />
      <pos-order-voucher-dialog
          v-model={dialog.voucher}
          addVoucher={addVoucher}
          redeemVoucher={redeemVoucher}
      />
    </>)
  },
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
    },
    addModifierToProduct() {
    },
    getKeyboardSetting() {
    },
    addItemQuantity() {
    },
    removeItemQuantity() {
    },
    changePrice() {
    },
    updateOrderTable() {
    },
    updateOrderItems() {
    },
    removeProductModifier() {
    },
    updateOrderItem() {
    },
    saveTableOrder() {
    },
    resetOrderData() {
    },
    updateCurrentOrder() {
    },
    quickCashRestaurant() {
    },
    openDialog(name) {
      this.dialog[name] = true
    },
    createOrderCommit() {
    },
    saveSplitOrder() {
    },
    printOrderReport() {
    },
    updatePrintedOrder() {
    },
    moveItems() {
    },
    addVoucher() {
    },
    redeemVoucher() {
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
