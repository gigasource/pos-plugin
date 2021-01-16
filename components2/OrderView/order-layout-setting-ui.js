import {
  fontSize,
  category,
  minimumTextRow,
  collapseBlankColumn,
  collapseText,
  showOverlay,
  showSplitBtn,
  smallSidebar,
  scrollableLayout,
  editModeOL,
  changeSize,
  changeCategory,
  changeCategorySize,
  changeCategoryFontSize,
  hideBlankColumn,
  hideTextRow,
  saveOrderLayoutSetting
} from './order-layout-setting-logic';
import {isMobile} from "../AppSharedStates";

export function renderOLSetting() {
  if (!editModeOL.value) return;
  return (<>
    <div class="row-flex align-items-center">
      <span class="mr-1">Product font size:</span>
      <g-icon onClick={() => changeSize(-0.5)}>remove_circle</g-icon>
      <span>{{fontSize}}</span>
      <g-icon onClick={() => changeSize(0.5)}>add_circle</g-icon>
    </div>
    <g-btn-bs small style="margin-left: 0" class="elevation-1" onClick={() => changeCategory()}>
      Change category mode
    </g-btn-bs>
    <div style="text-transform: capitalize">Mode: {category.type}</div>
    <g-checkbox disabled={category.type !== 'horizontal'} v-model={category.singleRow}
                label="Single Row Category"/>
    <g-checkbox
      disabled={!((category.type === 'vertical') || (category.type === 'horizontal' && category.singleRow))}
      v-model={category.differentSize}
      label={`Different ${category.type === 'vertical' ? 'Height' : 'Width'}`}/>
    <div class="row-flex align-items-center">
      <span class="mr-1">Category size</span>
      <g-icon onClick={() => changeCategorySize(-4)}>remove_circle</g-icon>
      <span>{category.size}</span>
      <g-icon onClick={() => changeCategorySize(4)}>add_circle</g-icon>
    </div>
    <div class="row-flex align-items-center">
      <span class="mr-1">Category font size</span>
      <g-icon onClick={() => changeCategoryFontSize(-0.5)}>remove_circle</g-icon>
      <span>{category.fontSize}</span>
      <g-icon onClick={() => changeCategoryFontSize(0.5)}>add_circle</g-icon>
    </div>
    <g-checkbox v-model={minimumTextRow.value} label="Minimize only text row"/>
    <g-checkbox v-model={hideTextRow.value} label="Hide text row" />
    <g-checkbox v-model={collapseBlankColumn.value} label="Narrow empty column" />
    <g-checkbox v-model={hideBlankColumn.value} label="Hide empty column" />
    <g-checkbox v-model={collapseText.value} label="Shrink product title" />
    <g-checkbox v-model={showOverlay.value} label="Show overlay in action" />
    <g-checkbox v-model={showSplitBtn.value} label="Show split button in action" />
    <g-checkbox v-model={smallSidebar.value} label="Small sidebar" />
    <g-checkbox v-model={scrollableLayout.value} label="Scrollable layout" />
    <g-btn-bs width="100" small style="margin-left: calc(90% - 100px)" background-color="#1271FF"
              onClick={saveOrderLayoutSetting}>Save
    </g-btn-bs>
  </>)
}

export function getRootStyle() {
  const style = {
    height: '100%',
    maxHeight: '100%'
  }

  if (isMobile.value) {
    Object.assign(style, {height: '100vh', maxHeight: '100vh', padding: '0 4px', width: '256px'})

    if (smallSidebar.value) {
      Object.assign(style, {width: '225px'})
    }
  }
  return style
}

