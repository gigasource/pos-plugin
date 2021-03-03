import { computed, ref } from 'vue'
import {appHooks, posSettings} from '../../../AppSharedStates';
import DialogProductLookup from './dialogProductLookup'
import DialogSavedList from './dialogSavedList'
import {genScopeId} from "../../../utils";


export const FnBtns = {
  'Refund': {
    name: 'FnBtn_Refund',
    text: 'Refund order',
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
    text: 'Product look up',
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
    text: 'Discount',
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
    text: 'Change price',
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
    text: 'Save list',
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
    text: 'Default',
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
export const fnBtnSetting = computed(() => {
    return (posSettings.value && posSettings.value.rightFunctionButtons) || []
})

async function updatePosSetting(val) {
  await cms.getModel('PosSetting').updateOne({}, { rightFunctionButtons: val })
  appHooks.emit('settingChange')
}

//<editor-fold desc="dialog logic">
const limitValue = {
  MIN_ROW: 1,
  MAX_ROW: 12,
  MIN_COL: 1,
  MAX_COL: 2
}
export function removeBtnFn(name) {
  const fnBtnIndex = fnBtnSetting.value.findIndex(fnBtn => fnBtn.fn === name)
  if (fnBtnIndex > -1) {
    fnBtnSetting.value.splice(fnBtnIndex, 1)
  }
}
export async function addBtnFn() {
  //todo: add rules to g-select to prevent select duplicate item
  await updatePosSetting([...fnBtnSetting.value, {
    rows: [selectedBtn.value.row, selectedBtn.value.row + selectedBtn.value.height],
    cols: [selectedBtn.value.col, selectedBtn.value.col + selectedBtn.value.width],
    "backgroundColor": "#FFFFFF", //todo: add bg color
    text: FnBtns[selectedBtn.value.fn].text,
    fn: selectedBtn.value.fn
  }])
  showDialogBtnFn.value = false
}

const showDialogBtnFn = ref(false)
export const selectedBtn = ref({
  row: 1,
  col: 1,
  height: 1,
  width: 1,
  fn: ''
})
export function showSetBtnFnDialog(row, col) {
  selectedBtn.value = {
    row,
    col,
    height: 1,
    width: 1,
    fn: ''
  }
  showDialogBtnFn.value = true
}

export function renderDialogSetBtn() {
  return (
    <g-dialog v-model={showDialogBtnFn.value}>
      {
        genScopeId(() => (
          <div>
            <pos-textfield-new disabled={true} v-model={selectedBtn.value.row}/>
            <pos-textfield-new disabled={true} v-model={selectedBtn.value.col}/>
            <div class="row-flex">
              <g-icon onClick={() => selectedBtn.value.height -= (selectedBtn.value.height - 1 >= 1 ? limitValue.MIN_ROW : 0)}>remove_circle</g-icon>
              <span>{selectedBtn.value.height}</span>
              <g-icon onClick={() => selectedBtn.value.height += (selectedBtn.value.height + selectedBtn.value.row < limitValue.MAX_ROW ? 1 : 0)}>add_circle</g-icon>
            </div>
            <div className="row-flex">
              <g-icon onClick={() => selectedBtn.value.width -= (selectedBtn.value.width - 1 >= limitValue.MIN_COL ? 1 : 0)}>remove_circle</g-icon>
              <span>{selectedBtn.value.width}</span>
              <g-icon onClick={() => selectedBtn.value.width += (selectedBtn.value.col + selectedBtn.value.width < limitValue.MAX_COL ? 1 : 0)}>add_circle</g-icon>
            </div>
            <g-select text-field-component="GTextFieldBs" items={FnBtnNames.value}
                      v-model={selectedBtn.value.fn} placeholder="Reason (Optional)">
            </g-select>
            <g-btn onClick={addBtnFn}>Add button</g-btn>
          </div>
        ))()
      }
    </g-dialog>
  )
}
//</editor-fold>

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
