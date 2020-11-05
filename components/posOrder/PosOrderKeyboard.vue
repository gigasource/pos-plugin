<template>
  <div class="pos-keyboard" :style="keyboardStyles">
    <div class="pos-keyboard-screen" :style="screenStyles">
      <input class="pos-keyboard-screen__input" v-model="productIdQuery"/>
      <g-icon v-if="productIdQuery" size="20" @click="clearScreen">icon-cancel</g-icon>
    </div>
    <g-keyboard :template="keyboardTemplate" :items="keyboardItems" v-model="productIdQuery" @submit="openDialogProductSearchResults" @edit="edit($event)"/>
  </div>
</template>

<script>
  const actionMap = {
    insert: (value, append) => (value + append),
    delete: (value) => value.substring(0, value.length - 1),
    shift: (isShift) => (!isShift),
    enter: () => {
    },
    x: val => val.includes(' x ') ? val : `${val} x `
  }

  const defaultKeyboard = {
    columns: 3,
    rows: 4,
    items: [
      {top: 1, left: 1, bottom: 2, right: 2, value: '7', type: 'text'},
      {top: 1, left: 2, bottom: 2, right: 3, value: '8', type: 'text'},
      {top: 1, left: 3, bottom: 2, right: 4, value: '9', type: 'text'},
      {top: 2, left: 1, bottom: 3, right: 2, value: '4', type: 'text'},
      {top: 2, left: 2, bottom: 3, right: 3, value: '5', type: 'text'},
      {top: 2, left: 3, bottom: 3, right: 4, value: '6', type: 'text'},
      {top: 3, left: 1, bottom: 4, right: 2, value: '1', type: 'text'},
      {top: 3, left: 2, bottom: 4, right: 3, value: '2', type: 'text'},
      {top: 3, left: 3, bottom: 4, right: 4, value: '3', type: 'text'},
      {top: 4, left: 1, bottom: 5, right: 2, value: '0', type: 'text'},
      {top: 4, left: 2, bottom: 5, right: 3, value: ' x ', type: 'x'},
      {top: 4, left: 3, bottom: 5, right: 4, type: 'enter'},
    ],
  }

  export default {
    name: "PosOrderKeyboard",
    props: {
      keyboardConfig: Object,
      mode: {
        type: String,
        default: 'active'
      }
    },
    injectService: ['OrderStore:(productIdQuery,queryProductsById,productIdQueryResults,addProductToOrder,addModifierToProduct)'],
    computed: {
      mainKeyboard() {
        const keyboard = _.cloneDeep(defaultKeyboard)
        if (!this.keyboardConfig.x) {
          const index = keyboard.items.findIndex(k => k.type === 'x')
          if(index > 0) {
            keyboard.items.splice(index, 1)
            const enter = keyboard.items.find(k => k.type === 'enter')
            enter.left--
          }
        }
        return keyboard
      },
      leftsideItems() {
        let keys = [], maxColumns = 0

        for (let i = 0; i < this.keyboardConfig.layout.length; i++ ) {
          const rows = this.keyboardConfig.layout[i].rows
          if (maxColumns < rows.length) maxColumns = rows.length
          for (let j = 0; j < rows.length; j++) {
            if(rows[j].trim() === '') {
              if(this.mode === 'edit') {
                keys.push({top: i+1, left: j+1, bottom: i+2, right: j+2, type: 'edit'})
              }
              continue
            }
            const existKey = keys.find(key => key.value === rows[j])
            if(existKey && j+1 < existKey.right && j+1 >= existKey.left && i+1 < existKey.bottom && i+1 >= existKey.top) continue
            const key = { top: i + 1, left: j + 1, bottom: i + 2, right: j + 2, value: rows[j]}
            let k = j+1
            //check duplicate in horizontal
            while(k < rows.length) {
              if(rows[k] === rows[j]) {
                key.right++
                k++;
              } else {
                break
              }
            }
            k = i+1
            //check duplicate in vertical
            while(k < this.keyboardConfig.layout.length) {
              const nextRows = this.keyboardConfig.layout[k].rows
              if(nextRows[j] === rows[j]) {
                let flag = false
                if(key.right > key.left + 1) {
                  for (let t = key.left; t < key.right; t++) {
                    if(nextRows[t-1] !== rows[j]) {
                      flag = true
                      break
                    }
                  }
                }
                if(!flag) {
                  key.bottom++
                  k++
                } else {
                  break
                }
              } else {
                break
              }
            }
            if(this.mode === 'edit') {
              key.type = 'edit'
            }
            keys.push(key)
          }
        }
        return { items: keys, rows: this.keyboardConfig.layout.length, columns: maxColumns}
      },
      keyboardStyles() {
        let styles = {}
        styles['grid-area'] = `${this.keyboardConfig.top}/${this.keyboardConfig.left}/${this.keyboardConfig.top + this.keyboardConfig.height}/${this.keyboardConfig.left + this.keyboardConfig.width}`
        styles['grid-template-rows'] = `repeat(${Math.max(this.mainKeyboard.rows, this.leftsideItems.rows) + 1}, 1fr)`
        styles['grid-template-columns'] = `repeat(${this.mainKeyboard.columns + this.leftsideItems.columns}, 1fr)`
        styles['grid-gap'] = `5px`
        return styles
      },
      screenStyles() {
        return {
          'grid-area': `1/1/2/${this.mainKeyboard.columns + this.leftsideItems.columns + 1}`
        }
      },
      keyboardTemplate() {
        let template = ''
        template += `grid-area: 2/1/${Math.max(this.mainKeyboard.rows, this.leftsideItems.rows) + 2}/${this.mainKeyboard.columns + this.leftsideItems.columns + 1};`
        template += `grid-template-rows: repeat(${Math.max(this.mainKeyboard.rows, this.leftsideItems.rows)}, 1fr);`
        template += `grid-template-columns: repeat(${this.mainKeyboard.columns + this.leftsideItems.columns}, 1fr);`
        template += `grid-gap: 5px;`
        return template
      },
      keyboardItems() {
        const mainItems = this.mainKeyboard.items.map(item => {
          let key = {}
          let content = []
          if (item.value && typeof item.value === 'string') content.push(item.value)
          Object.assign(key, {content})
          if (item.type === 'text') {
            Object.assign(key, {action: actionMap.insert})
          } else {
            Object.assign(key, {type: item.type, action: actionMap[item.type]})
            if (!item.value) Object.assign(key, {img: `delivery/key_${item.type}`})
          }
          let left = item.left + this.leftsideItems.columns,
              right = item.right + this.leftsideItems.columns,
              style = `grid-area: ${item.top}/${left}/${item.bottom}/${right}`
          Object.assign(key, {style})
          return key
        })
        const extraItems = this.leftsideItems.items.map(item => ({
          content: item.value && [item.value],
          action: item.type !== 'edit' && actionMap.insert,
          style: `grid-area: ${item.top}/${item.left}/${item.bottom}/${item.right}`,
          ... item.type === 'edit' && {
            type: 'edit',
            position: {top: item.top, left: item.left},
            img: !item.value && 'order/add'
          },
        }))
        return [...mainItems, ...extraItems]
      }
    },
    methods: {
      clearScreen() {
        this.productIdQuery = ''
      },
      async openDialogProductSearchResults() {
        if(this.mode !== 'active') {
          return
        }
        if (this.productIdQuery.trim()) {
          await this.queryProductsById()
          if (this.productIdQueryResults.length === 1) {
            const onlyResult = this.productIdQueryResults[0];
            if (onlyResult.attributes.length === 0 || onlyResult.attributes.keys().length === onlyResult.attributes.length) {
              if(onlyResult.isModifier) {
                onlyResult.product = onlyResult._id.toString()
                onlyResult.quantity = onlyResult.quantity || 1
                this.addModifierToProduct(onlyResult)
              } else {
                this.addProductToOrder(onlyResult)
              }
              this.productIdQuery = ''
              return
            }
          }
          this.$nextTick(() => {
            this.$getService('dialogProductSearchResult:setActive')(true)
          })
        }
      },
      edit(position) {
        this.$emit('edit:keyboard', position)
      }
    }
  }
</script>

<style scoped lang="scss">
  .pos-keyboard {
    display: grid;
    background-color: white;
    z-index: 2;

    &-screen {
      background: #EEEEEE;
      border: 1px solid #979797;
      border-radius: 2px;
      display: flex;
      align-items: stretch;
      padding: 0 8px;

      &__input {
        flex: 1;
        background: transparent;
        color: #1d1d26;
        outline: none;
        font-size: 18px;
        width: calc(100% - 24px);
      }

      .g-icon {
        align-self: center;
        cursor: pointer;
      }
    }

    ::v-deep .key {
      border: 1px solid #979797;

      .waves-ripple {
        background-color: rgba(255, 190, 92, 1)
      }
    }
  }
</style>
