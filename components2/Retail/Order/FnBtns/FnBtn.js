import { computed, ref } from 'vue'
import { posSettings } from '../../../AppSharedStates';
import DialogProductLookup from './dialogProductLookup'
import DialogSavedList from './dialogSavedList'

export const FnBtns = {
  'Refund': {
    name: 'FnBtn_Refund',
    props: {
      btnInput: Object
    },
    components: {},
    setup(props) {
      const showRefundDialog = ref(false)
      return () => <div>
        <div onClick={() => showRefundDialog.value = true}>Refund</div>
        <dialog-retail-refund-search v-model={showRefundDialog.value}/>
      </div>
    }
  },
  'ProductLookup': {
    name: 'FnBtn_ProductLookup',
    props: {
      btnInput: Object
    },
    components: { DialogProductLookup },
    setup(props) {
      const showProductLookUp = ref(false)
      return () => <div>
        <div onClick={() => showProductLookUp.value = true}>Product Lookup</div>
        <dialog-product-lookup v-model={showProductLookUp.value}></dialog-product-lookup>
      </div>
    }
  },
  'Discount': {
    name: 'FnBtn_Discount',
    setup() {
      const showDiscountDialog = ref(false)
      return () => <div>
        <g-btn>Discount</g-btn>
        <div v-model={showDiscountDialog.value}></div>
      </div>
    }
  },
  'ChangePrice': {
    name: 'FnBtn_ChangePrice',
    setup() {
      const showChangePriceDialog = ref(false)
      return () => <div>
        <div onClick={() => showChangePriceDialog.value = true}>Change Price</div>
        <dialog-change-value v-model={showChangePriceDialog.value} new-value-editable onSubmit={updateNewPrice}></dialog-change-value>
      </div>
    }
  },
  'SavedList': {
    name: 'FnBtn_SavedList',
    components: { DialogSavedList },
    setup() {
      const showSavedListDialog = ref(false)
      return () => <div class='row-flex'>
        <g-btn>Save</g-btn>
        <g-btn onClick={() => showSavedListDialog.value = true}>...</g-btn>
        <dialog-saved-list v-model={showSavedListDialog.value}/>
      </div>
    }
  },
  'Default': {
    name: 'Default_button',
    props: {
      btnInput: Object
    },
    setup(props) {
      const { btnInput } = props
      return () => <div>
        {btnInput && btnInput.text}
      </div>
    }
  }
}
export const FnBtnNames = computed(() => Object.keys(FnBtns))
export const fnBtnSetting = computed({
  get: () => {
    return (posSettings.value && posSettings.value.rightFunctionButtons) || []
  },
  set: async (val) => {
    // TODO: ensure it works
    fnBtnSetting.value = val
    await cms.getModel('PosSetting').updateOne({ rightFunctionButtons: val })
  }
})
export function removeBtnFn(name) {
  const fnBtnIndex = fnBtnSetting.value.findIndex(fnBtn => fnBtn.fn === name)
  if (fnBtnIndex > -1) {
    fnBtnSetting.value.splice(fnBtnIndex, 1)
  }
}
export function addBtnFn(btnFn) {
  fnBtnSetting.value.push(btnFn)
}
export function showSetBtnFnDialog(row, column) {

}

const mock = [
  { 'rows': [5, 7], 'cols': [1, 1], 'backgroundColor': '#7BB872', 'textColor': '#FFFFFF', 'fn': 'Refund' },
  { 'rows': [5, 7], 'cols': [1, 1], 'backgroundColor': '#7BB872', 'textColor': '#FFFFFF', 'fn': 'Quick Cash' },
  { 'rows': [5, 5], 'cols': [2, 2], 'backgroundColor': '#F9A825', 'textColor': '#FFFFFF', 'fn': 'Save' },
  { 'rows': [6, 6], 'cols': [2, 2], 'backgroundColor': '#1271FF', 'textColor': '#FFFFFF', 'fn': 'Pay' }
]

// TOOD: Fixed refund ????
// { "rows": [5, 7], "cols": [1, 1], "backgroundColor": "#1271FF", "textColor": "#FFFFFF", "text": "Refund" },
// { "rows": [5, 5], "cols": [2, 2], "backgroundColor": "#F9A825", "textColor": "#FFFFFF", "text": "Save" },
// { "rows": [4, 4], "cols": [1, 3], "backgroundColor": "#FFFFFF", "textColor": "#000000", "text": "Change refund fee" }
