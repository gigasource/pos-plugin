import {
  category,
  changeCategory,
  changeCategoryFontSize,
  changeCategorySize,
  changeSize,
  collapseBlankColumn,
  collapseText,
  editModeOL,
  fontSize,
  hideBlankColumn,
  hideTextRow,
  minimumTextRow,
  saveOrderLayoutSetting,
  scrollableLayout,
  showOverlay,
  showSplitBtn,
  smallSidebar
} from './order-layout-setting-logic';
import { ref } from 'vue';
import { isMobile } from '../AppSharedStates';

const showCategory = ref(false)
const showProduct = ref(false)
const showSidebar = ref(false)

export function renderOLSetting() {
  if (!editModeOL.value)
    return;
  return (
      <div style="max-height: 90%;">
        <div style="max-height: 80%; overflow: scroll">
          <div class="mt-3">
            <div class="ta-left row-flex justify-between" style="background: #e2e2e2; padding: 5px" onClick={() => showCategory.value = !showCategory.value}>
              Category
              { showCategory.value ? <g-icon>fas fa-angle-up</g-icon> : <g-icon>fas fa-angle-down</g-icon> }
            </div>
            { showCategory.value && <div style="padding: 4px; border: 1px solid #e2e2e2">
              <div>
                <div class="row-flex justify-between">
                  <div style="text-transform: capitalize">Mode: {category.type}</div>
                  <g-btn small flat outlined style="margin-right: 0" onClick={() => changeCategory()}>Switch</g-btn>
                </div>
                <g-checkbox disabled={category.type !== 'horizontal'} v-model={category.singleRow}
                            label="Single Row Category"/>
              </div>

              <g-checkbox
                  disabled={!((category.type === 'vertical') || (category.type === 'horizontal' && category.singleRow))}
                  v-model={category.differentSize}
                  label={`Different ${category.type === 'vertical' ? 'Height' : 'Width'}`}/>

              <div class="row-flex align-items-center  justify-between">
                <span class="mr-1">{category.type === 'vertical' ? 'Width' : 'Height'}</span>
                <div>
                  <g-icon onClick={() => changeCategorySize(-4)}>remove_circle</g-icon>
                  <span style="width: 60px; display: inline-block">{category.size}</span>
                  <g-icon onClick={() => changeCategorySize(4)}>add_circle</g-icon>
                </div>
              </div>

              <div class="row-flex align-items-center justify-between">
                <span class="mr-1">Font size</span>
                <div>
                  <g-icon onClick={() => changeCategoryFontSize(-0.5)}>remove_circle</g-icon>
                  <span style="width: 60px; display: inline-block">{category.fontSize}</span>
                  <g-icon onClick={() => changeCategoryFontSize(0.5)}>add_circle</g-icon>
                </div>
              </div>
            </div> }
          </div>

          <div class="mt-1">
            <div class="ta-left row-flex justify-between" style="background: #e2e2e2; padding: 5px" onClick={() => showProduct.value = !showProduct.value}>
              Product
              { showProduct.value ? <g-icon>fas fa-angle-up</g-icon> : <g-icon>fas fa-angle-down</g-icon> }
            </div>
            { showProduct.value && <div style="padding: 4px; border: 1px solid #e2e2e2">
              <div class="row-flex align-items-center justify-between">
                <span class="mr-1">Font size:</span>
                <div>
                  <g-icon onClick={() => changeSize(-0.5)}>remove_circle</g-icon>
                  <span style="width: 60px; display: inline-block">{fontSize.value}</span>
                  <g-icon onClick={() => changeSize(0.5)}>add_circle</g-icon>
                </div>
              </div>
              <g-checkbox v-model={minimumTextRow.value} label="Minimize only text row"/>
              <g-checkbox v-model={hideTextRow.value} label="Hide text row"/>
              <g-checkbox v-model={collapseBlankColumn.value} label="Narrow empty column"/>
              <g-checkbox v-model={hideBlankColumn.value} label="Hide empty column"/>
              <g-checkbox v-model={collapseText.value} label="Shrink product title"/>
              <g-checkbox v-model={showOverlay.value} label="Show overlay in action"/>
              <g-checkbox v-model={showSplitBtn.value} label="Show split button in action"/>
              <g-checkbox v-model={scrollableLayout.value} label="Scrollable layout"/>
            </div> }
          </div>

          <div class="mt-1">
            <div class="ta-left row-flex justify-between" style="background: #e2e2e2; padding: 5px" onClick={() => showSidebar.value = !showSidebar.value}>
              Sidebar
              { showSidebar.value ? <g-icon>fas fa-angle-up</g-icon> : <g-icon>fas fa-angle-down</g-icon> }
            </div>
            { showSidebar.value && <div style="padding: 4px; border: 1px solid #e2e2e2">
              <g-checkbox v-model={smallSidebar.value} label="Small sidebar"/>
            </div> }
          </div>
        </div>

        <div class="row-flex justify-end mt-2">
          <g-btn-bs width="100" small style="margin-right: 0" background-color="#1271FF"
                    onClick={saveOrderLayoutSetting}>Save
          </g-btn-bs>
        </div>
      </div>
  )
}

export function getRootStyle() {
  const style = {
    height: '100%',
    maxHeight: '100%'
  }

  if (isMobile.value) {
    Object.assign(style, { height: '100vh', maxHeight: '100vh', padding: '0 4px', width: '256px' })

    if (smallSidebar.value) {
      Object.assign(style, { width: '225px' })
    }
  }
  return style
}

