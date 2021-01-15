import cms from 'cms';
import {computed, reactive, ref} from "vue";
import {editable, selectedCategoryLayout} from "./pos-ui-shared";
import _ from "lodash";

export const keyboardConfig = ref();

const dialog = reactive({
  value: false,
  position: {},
  search: false
})

export async function loadKeyboardConfig() {
  const setting = await cms.getModel('PosSetting').findOne()
  const _keyboardConfig = setting.keyboardConfig;
  // work-around: Fixing error keyboardConfig is null
  // TODO: Find what is the purpose of keyboardConfig layout
  if (_keyboardConfig && !_keyboardConfig.layout)
    _keyboardConfig.layout = []
  keyboardConfig.value = _keyboardConfig || {layout: []};
}

const showCalculator = computed(() => {
  if (!selectedCategoryLayout.value || !keyboardConfig.value)
    return false
  //out of boundary
  if (selectedCategoryLayout.value.rows <= keyboardConfig.value.top
    || selectedCategoryLayout.value.columns <= keyboardConfig.value.left)
    return false

  let show = keyboardConfig.value.active
  if (keyboardConfig.value.onlyShowInFirstPage) {
    const {top, left} = selectedCategoryLayout.value
    if (top !== 0 || left !== 0)
      show = false
  }

  return show
})

async function updateKeyboardConfig(keyboardConfig) {
  await cms.getModel('PosSetting').findOneAndUpdate({}, {$set: {keyboardConfig}})
}

async function changeKeyboardExtension(val) {
  const config = Object.assign({}, keyboardConfig.value)
  _.set(config, ['layout', dialog.position.top - 1, 'rows', dialog.position.left - 1], val)
  await updateKeyboardConfig(config)
  keyboardConfig.value = config;
}

function opendDialogEdit(position) {
  dialog.position = position
  dialog.value = true
}

export function orderLayoutKeyboardFactory() {
  const renderKeyboard = () => (
    <>
      {showCalculator && <pos-order-keyboard keyboard-config={keyboardConfig}
                           mode={editable.value ? 'edit' : 'active'}
                           onEdit_keyboard={(e) => opendDialogEdit(e)}
                           onOpenDialogSearch={() => dialog.search = true}/>}
      <dialog-text-filter v-model={dialog.value} onSubmit={e => changeKeyboardExtension(e)}/>
      <dialog-product-search-result v-model={dialog.search}/>
    </>
  )

  return {
    renderKeyboard
  }
}
