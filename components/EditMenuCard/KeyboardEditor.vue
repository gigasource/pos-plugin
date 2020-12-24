<template>
  <div class="keyboard-editor">
    <div class="keyboard-editor__title">{{$t('restaurant.menuEdit.keyboardPosition')}}</div>
    <g-btn-bs elevation="2" style="margin: 0 0 12px" @click="dialog = true" icon="select_all">{{$t('ui.choose')}}</g-btn-bs>
    <div class="keyboard-editor__title">{{$t('restaurant.menuEdit.expansionColumn')}}</div>
    <div class="row-flex">
      <input-number width="148" :model-value="extraColumns" @update:modelValue="changeExtraColumns"/>
      <g-btn-bs elevation="2" icon="icon-redo" @click="resetKeyboard">{{$t('ui.reset')}}</g-btn-bs>
    </div>
    <g-checkbox v-model="active" label="Active Keyboard"/>
    <g-checkbox v-model="onlyShowInFirstPage" label="Show Keyboard only in first page"/>
    <g-checkbox v-model="x" label="Show 'x' Button"/>
    <g-dialog v-model="dialog" width="90%" height="90%" eager>
      <div class="dialog">
        <div class="dialog-title">{{$t('restaurant.menuEdit.keyboardPosition')}}</div>
        <div class="dialog-content" :style="getDialogStyles()">
          <template v-for="row in selectedCategoryLayout.rows">
            <template v-for="column in selectedCategoryLayout.columns" :key="`${column}_${row}`">
              <div class="dialog-content__cell"
                   :style="getCellStyles(column, row)"
                   @mousedown="(e) => onmousedown(e, column, row)"
                   @touchstart="(e) => onmousedown(e, column, row)"
                   @mouseenter="() => mouseenter(column, row)"
                   @touchmove="(e) => touchmove(e, column, row)"
                   @mouseup="() => onmouseup()"
                   @touchend="() => onmouseup()">
              </div>
            </template>
          </template>
          <div :style="selectingCells"></div>
        </div>
        <div class="dialog-action">
          <g-btn-bs text-color="#424242" @click="closeDialog">Cancel</g-btn-bs>
          <g-btn-bs width="120" background-color="#2979FF" @click="changeLayout">OK</g-btn-bs>
        </div>
      </div>
    </g-dialog>
  </div>
</template>

<script>
  
  export default {
    name: "KeyboardEditor",
    props: {
      keyboardConfig: null,
      selectedCategoryLayout: null
    },
    injectService: [
      'SettingsStore:(getPosSetting, updateKeyboardConfig)'
    ],
    emits: ['update:keyboardConfig'],
    data() {
      return {
        dialog: false,
        mouseDownCell: {
          x: 0,
          y: 0
        },
        mouseCurrentCell: {
          x: 0,
          y: 0
        },
        selecting: false
      }
    },
    computed: {
      active: {
        get() {
          if(this.keyboardConfig) {
            return this.keyboardConfig.active
          }
          return 1
        },
        set(val) {
          this._updateKeyboardConfig({active: val})
        }
      },
      onlyShowInFirstPage: {
        get() {
          if(this.keyboardConfig) {
            return this.keyboardConfig.onlyShowInFirstPage
          }
          return 1
        },
        set(val) {
          this._updateKeyboardConfig({onlyShowInFirstPage: val})
        }
      },
      x: {
        get() {
          if(this.keyboardConfig) {
            return this.keyboardConfig.x
          }
          return 1
        },
        set(val) {
          this._updateKeyboardConfig({x: val})
        }
      },
      extraColumns() {
        if(this.keyboardConfig) {
          return _.max(this.keyboardConfig.layout.map(layout => layout.rows.length)) || 0
        }
        return 0
      },
      selectingCells() {
        let down = _.cloneDeep(this.mouseDownCell),
            up = _.cloneDeep(this.mouseCurrentCell)
        if(this.mouseDownCell.x > this.mouseCurrentCell.x) {
          down.x = this.mouseCurrentCell.x
          up.x = this.mouseDownCell.x
        }
        if(this.mouseDownCell.y > this.mouseCurrentCell.y) {
          down.y = this.mouseCurrentCell.y
          up.y = this.mouseDownCell.y
        }
        return {
            'grid-area': `${down.y}/${down.x}/${up.y + 1}/${up.x + 1}`,
            'background': '#D0D5F3'
          }
      }
    },
    methods: {
      async _updateKeyboardConfig(change) {
        const config = Object.assign({}, this.keyboardConfig)
        Object.assign(config, change)
        await this.updateKeyboardConfig(config)
        this.$emit('update:keyboardConfig', config)
      },
      async changeExtraColumns(val) {
        const config = Object.assign({}, this.keyboardConfig)
        const layout = config.layout
        if(val > this.extraColumns) { //add column
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
        await this.updateKeyboardConfig(config)
        this.$emit('update:keyboardConfig', config)
      },
      async resetKeyboard() {
        const config = Object.assign({}, this.keyboardConfig)
        const layout = config.layout
        for(const l of layout) {
          l.rows = _.map(l.rows, key => ' ')
        }
        await this.updateKeyboardConfig(config)
        this.$emit('update:keyboardConfig', config)
      },
      getDialogStyles() {
        return {
          'display': 'grid',
          'grid-template-columns': `repeat(${this.selectedCategoryLayout.columns}, 1fr)`,
          'grid-template-rows': `repeat(${this.selectedCategoryLayout.rows}, 1fr)`,
        }
      },
      getCellStyles(column, row) {
        return {
          'grid-area': `${row}/${column}/${row+1}/${column+1}`,
        }
      },
      onmousedown(e, column, row) {
        this.selecting = true
        this.mouseDownCell = {x: column, y: row}
        this.mouseCurrentCell = {x: column, y: row}
        if (e.type === 'touchstart') {
          console.log(e)
        }
      },
      mouseenter(column, row) {
        if(this.selecting) {
          this.mouseCurrentCell = {x: column, y: row}
        }
      },
      onmouseup() {
        this.selecting = false
      },
      changeLayout() {
        let down = _.cloneDeep(this.mouseDownCell),
            up = _.cloneDeep(this.mouseCurrentCell)
        if (this.mouseDownCell.x > this.mouseCurrentCell.x) {
          down.x = this.mouseCurrentCell.x
          up.x = this.mouseDownCell.x
        }
        if (this.mouseDownCell.y > this.mouseCurrentCell.y) {
          down.y = this.mouseCurrentCell.y
          up.y = this.mouseDownCell.y
        }
        this._updateKeyboardConfig({
          top: down.y,
          left: down.x,
          width: (up.x - down.x) + 1,
          height: (up.y - down.y) + 1,
        })
        this.dialog = false
      },
      touchmove(e) {
        const ele = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)
        if(ele.classList.contains('dialog-content__cell')) {
          const area = ele.style['grid-area'].replace(' ', '').split('/')
          if(this.mouseCurrentCell.x === area[1] && this.mouseCurrentCell.y === area[0]) return
          this.mouseCurrentCell = {
            x: +area[1],
            y: +area[0],
          }
        }
      },
      closeDialog() {
        this.mouseCurrentCell = {x: 0, y: 0}
        this.mouseDownCell = {x: 0, y: 0}
        this.dialog = false
      }
    },
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
