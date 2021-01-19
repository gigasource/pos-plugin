
<script>
import InputNumber2 from './InputNumber2';
import {selectedCategoryLayout} from '../OrderView/pos-ui-shared';
import {keyboardConfig, updateKeyboardConfig} from '../OrderView/order-layout-keyboard';
import {reactive, computed} from 'vue';
import { useI18n } from 'vue-i18n'

export default {
  name: 'KeyboardEditor2.vue',
  components: {InputNumber2},
  props: {},
  setup() {
    const { t } = useI18n()

    const state = reactive({
      dialog: false,
      mouseDownCell: { x: 0, y: 0 },
      mouseCurrentCell: { x: 0, y: 0 },
      selecting: false
    })

    const active = computed({
      get: () => {
        if(keyboardConfig.value)
          return keyboardConfig.value.active
        return 1
      },
      set: (val) => {
        _updateKeyboardConfig({active: val})
      }
    })

    const onlyShowInFirstPage = computed({
      get() {
        if(keyboardConfig.value) {
          return keyboardConfig.value.onlyShowInFirstPage
        }
        return 1
      },
      set(val) {
        _updateKeyboardConfig({onlyShowInFirstPage: val})
      }
    })

    const showXButton = computed({
      get() {
        if(keyboardConfig.value) {
          return keyboardConfig.value.x
        }
        return 1
      },
      set(val) {
        _updateKeyboardConfig({x: val})
      }
    })

    const extraColumns = computed(() => {
      if(keyboardConfig.value && keyboardConfig.value.layout) {
        return _.max(keyboardConfig.value.layout.map(layout => layout && layout.rows && layout.rows.length)) || 0
      }
      return 0
    })

    const selectingCells = computed(() => {
      let down = _.cloneDeep(state.mouseDownCell),
          up = _.cloneDeep(state.mouseCurrentCell)
      if(state.mouseDownCell.x > state.mouseCurrentCell.x) {
        down.x = state.mouseCurrentCell.x
        up.x = state.mouseDownCell.x
      }
      if(state.mouseDownCell.y > state.mouseCurrentCell.y) {
        down.y = state.mouseCurrentCell.y
        up.y = state.mouseDownCell.y
      }
      return {
        'grid-area': `${down.y}/${down.x}/${up.y + 1}/${up.x + 1}`,
        'background': '#D0D5F3'
      }
    })

    // methods
    async function _updateKeyboardConfig(change) {
      await updateKeyboardConfig(Object.assign({}, keyboardConfig.value, change))
    }
    async function changeExtraColumns(val) {
      const config = Object.assign({}, keyboardConfig.value)
      const layout = config.layout
      if(val > extraColumns.value) { //add column
        if(layout.length === 0) {
          while(layout.length < 4) {
            layout.push({rows: []})
          }
        }
        for(const l of layout) {
          l.rows.unshift(' ')
        }
      } else {
        for(const l of layout) {
          l.rows.shift()
        }
      }
      await updateKeyboardConfig(config)
    }
    async function resetKeyboard() {
      const config = Object.assign({}, keyboardConfig.value)
      const layout = config.layout
      for(const l of layout) {
        l.rows = _.map(l.rows, key => ' ')
      }
      await updateKeyboardConfig(config)
    }
    function getDialogStyles() {
      return {
        'display': 'grid',
        'grid-template-columns': `repeat(${selectedCategoryLayout.value.columns}, 1fr)`,
        'grid-template-rows': `repeat(${selectedCategoryLayout.value.rows}, 1fr)`,
      }
    }
    function getCellStyles(column, row) {
      return {
        'grid-area': `${row}/${column}/${row+1}/${column+1}`,
      }
    }
    function onmousedown(e, column, row) {
      state.selecting = true
      state.mouseDownCell = {x: column, y: row}
      state.mouseCurrentCell = {x: column, y: row}
      if (e.type === 'touchstart') {
        console.log(e)
      }
    }
    function mouseenter(column, row) {
      if(state.selecting) {
        state.mouseCurrentCell = {x: column, y: row}
      }
    }
    function onmouseup() {
      state.selecting = false
    }
    function changeLayout() {
      let down = _.cloneDeep(state.mouseDownCell),
          up = _.cloneDeep(state.mouseCurrentCell)
      if (state.mouseDownCell.x > state.mouseCurrentCell.x) {
        down.x = state.mouseCurrentCell.x
        up.x = state.mouseDownCell.x
      }
      if (state.mouseDownCell.y > state.mouseCurrentCell.y) {
        down.y = state.mouseCurrentCell.y
        up.y = state.mouseDownCell.y
      }
      _updateKeyboardConfig({
        top: down.y,
        left: down.x,
        width: (up.x - down.x) + 1,
        height: (up.y - down.y) + 1,
      })
      state.dialog = false
    }
    function touchmove(e) {
      const ele = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)
      if(ele.classList.contains('dialog-content__cell')) {
        const area = ele.style['grid-area'].replace(' ', '').split('/')
        if(state.mouseCurrentCell.x === area[1] && state.mouseCurrentCell.y === area[0]) return
        state.mouseCurrentCell = {
          x: +area[1],
          y: +area[0],
        }
      }
    }
    function closeDialog() {
      state.mouseCurrentCell = {x: 0, y: 0}
      state.mouseDownCell = {x: 0, y: 0}
      state.dialog = false
    }

    // template
    return () => <>
      <div class="keyboard-editor">
        <div class="keyboard-editor__title">{t('restaurant.menuEdit.keyboardPosition')}</div>
        <g-btn-bs elevation="2" style="margin: 0 0 12px" onClick={state.dialog = true} icon="select_all">{t('ui.choose')}</g-btn-bs>
        <div class="keyboard-editor__title">{t('restaurant.menuEdit.expansionColumn')} </div>
        <div class="row-flex">
          <input-number2 width="148" modelValue={extraColumns.value} onUpdate:modelvalue={changeExtraColumns}></input-number2>
          <g-btn-bs elevation="2" icon="icon-redo" onClick={resetKeyboard}>{t('ui.reset')} </g-btn-bs>
        </div>
        <g-checkbox v-model={active.value} label="Active Keyboard"/>
        <g-checkbox v-model={onlyShowInFirstPage.value} label="Show Keyboard only in first page"/>
        <g-checkbox v-model={showXButton.value} label="Show 'x' Button"/>
        <g-dialog v-model={state.dialog} width="90%" height="90%" eager>
          <div class="dialog">
            <div class="dialog-title">{t('restaurant.menuEdit.keyboardPosition')}</div>
            <div class="dialog-content" style={getDialogStyles()}>
              {selectedCategoryLayout.rows.map(row => <>
                    {selectedCategoryLayout.columns.map(column =>
                        <div class="dialog-content__cell"
                             style={getCellStyles(column, row)}
                             key={`${column}_${row}`}
                             onMouseDown={e => onmousedown(e, column, row)}
                             onTouchStart={e => onmousedown(e, column, row)}
                             onMouseEnter={() => mouseenter(column, row)}
                             onTouchMove={e => touchmove(e, column, row)}
                             onMouseUp={() => onmouseup()}
                             onTouchEnd={() => onmouseup()}>
                        </div>
                    )}
                  </>
              )}
              <div style={selectingCells}></div>
            </div>
            <div class="dialog-action">
              <g-btn-bs text-color="#424242" onClick={closeDialog}>Cancel</g-btn-bs>
              <g-btn-bs width="120" background-color="#2979FF" onClick={changeLayout}>OK</g-btn-bs>
            </div>
          </div>
        </g-dialog>
      </div>
    </>
  }
}
</script>
<style scoped lang="scss">
.keyboard-editor {
  padding-left: 20px;

  &__title {
    margin-top: 16px;
    margin-bottom: 6px;
    font-weight: 700;
  }

  .g-checkbox-wrapper {
    margin-top: 16px;
    margin-left: 0;
  }
}

.dialog {
  width: 100%;
  height: 90vh;
  background: white;
  border-radius: 4px;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;

  &-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 24px;
  }

  &-content {
    flex: 1;
    grid-gap: 5px;

    &__cell {
      border: 1px dashed #9e9e9e;
      cursor: pointer;
      z-index: 2;
    }
  }

  &-action {
    display: flex;
    align-items: center;
    align-self: flex-end;
    margin-top: 12px;
  }
}
</style>
