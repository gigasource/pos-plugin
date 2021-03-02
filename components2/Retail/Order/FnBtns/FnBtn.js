import { ref } from 'vue'
import DialogProductLookup from './dialogProductLookup'
import DialogSavedList from './dialogSavedList'

export const FnBtns = [
  {
    name: "Refund",
    component: {
      name: "FnBtn_Refund",
      components: {  },
      setup() {
        const showRefundDialog = ref(false)
        return () => <div>
          <g-btn onClick={() => showRefundDialog.value = true}>Refund</g-btn>
          <dialog-retail-refund-search v-model={showRefundDialog.value}/>
        </div>
      }
    },
  },
  {
    name: "ProductLookup",
    component: {
      name: "FnBtn_ProductLookup",
      components: { DialogProductLookup },
      setup() {
        const showProductLookUp = ref(false)
        return () => <div>
          <g-btn onClick={() => showProductLookUp.value = true}>Product Lookup</g-btn>
          <dialog-product-lookup v-model={showProductLookUp.value}></dialog-product-lookup>
        </div>
      }
    }
  },
  {
    name: "Discount",
    component: {
      name: 'FnBtn_Discount',
      setup() {
        const showDiscountDialog = ref(false)
        return () => <div>
          <g-btn>Discount</g-btn>
          <div v-model={showDiscountDialog.value}></div>
        </div>
      }
    }
  },
  {
    name: "ChangePrice",
    component: {
      name: "FnBtn_ChangePrice",
      setup() {
        const showChangePriceDialog = ref(false)
        return () => <div>
          <g-btn onClick={() => showChangePriceDialog.value = true}>Change Price</g-btn>
          <dialog-change-value v-model={showChangePriceDialog.value} new-value-editable onSubmit={updateNewPrice}></dialog-change-value>
        </div>
      }
    }
  },
  {
    name: "SavedList",
    component: {
      name: "FnBtn_SavedList",
      components: { DialogSavedList },
      setup() {
        const showSavedListDialog = ref(false)
        return () => <div class="row-flex">
          <g-btn>Save</g-btn>
          <g-btn onClick={() => showSavedListDialog.value = true}>...</g-btn>
          <dialog-saved-list v-model={showSavedListDialog.value}/>
        </div>
      }
    }
  }
]

export const FnNames = computed(() => Object.keys(FnBtns))
export const fnBtnSetting = ref([
  { "rows": [5, 7], "cols": [1, 1], "backgroundColor": "#7BB872", "textColor": "#FFFFFF", "fn": "Refund" },
])
