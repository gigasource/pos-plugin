<template>
  <div class="delivery-keyboard" :style="keyboardStyles">
    <div class="delivery-keyboard__screen" :style="screenStyles">
      <input class="delivery-keyboard__input" v-model="value"/>
      <g-icon color="#FF4552" class="delivery-keyboard__icon" @click="clear">cancel</g-icon>
    </div>
    <g-keyboard v-model="value" :items="keyboardItems" :template="keyboardTemplate" @submit="submit" @edit="editKeyboard"/>
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
    name: "posOrderDeliveryKeyboard",
    props: {
      keyboardConfig: {
        type: Array,
        default: () => []
      },
      mode: {
        type: String,
        default: 'active'
      }
    },
    data() {
      return {
        value: '',
      }
    },
    created() {

    },
    computed: {
      keyboardStyles() {
        let styles = {}
        styles['grid-template-rows'] = `auto repeat(${defaultKeyboard.rows + this.keyboardConfig.length}, 1fr)`
        styles['grid-template-columns'] = `repeat(${defaultKeyboard.columns}, 1fr)`
        styles['grid-gap'] = `5px`
        return styles
      },
      screenStyles() {
        return {
          'grid-area': `1/1/2/${defaultKeyboard.columns + 1}`
        }
      },
      keyboardTemplate() {
        let template = ''
        template += `grid-area: 2/1/${defaultKeyboard.rows + this.keyboardConfig.length + 2}/${defaultKeyboard.columns + 1};`
        template += `grid-template-rows: repeat(${defaultKeyboard.rows + this.keyboardConfig.length}, 1fr);`
        template += `grid-template-columns: repeat(${defaultKeyboard.columns}, 1fr);`
        template += `grid-gap: 5px;`
        return template
      },
      keyboardItems() {
        let upperItems = []
        for(let i = 0; i < this.keyboardConfig.length; i++) {
          const rows = this.keyboardConfig[i]
          for (let j = 0; j < rows.length; j++) {
            let key = {
              'grid-area': `${i+1}/${j+1}/${i+2}/${j+2}`
            }
            if(this.mode === 'edit') {
              Object.assign(key, { position: {top: i, left: j}, type: 'edit'})
              if(rows[j].trim() === '') {
                Object.assign(key, { img: 'order/add'})
              } else {
                Object.assign(key, { content: [rows[j]]})
              }
              upperItems.push(key)
            } else {
              if(rows[j].trim() !== '') {
                Object.assign(key, { type: 'text', action: actionMap.insert, content: [rows[j]]})
                upperItems.push(key)
              }
            }
          }
        }
        const defaultItems = defaultKeyboard.items.map(item => {
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
          let top = item.top + this.keyboardConfig.length,
              bottom = item.bottom + this.keyboardConfig.length,
              style = `grid-area: ${top}/${item.left}/${bottom}/${item.right}`
          Object.assign(key, {style})
          return key
        })
        return [...upperItems, ...defaultItems]
      }
    },
    methods: {
      clear() {
        this.value = ''
      },
      submit() {
        this.$emit('submit', this.value)
        this.clear()
      },
      editKeyboard(position) {
        this.$emit('edit:keyboard', position)
      }
    }
  }
</script>

<style scoped lang="scss">
  .delivery-keyboard {
    display: grid;
    background-color: white;
    z-index: 2;

    &__screen {
      display: flex;
      align-items: center;
      background: #EEEEEE;
      border: 1px solid #979797;
      border-radius: 2px;
      padding: 8px;
    }

    &__input {
      flex: 1;
      width: calc(100% - 24px);
      background: transparent;
      color: #1d1d26;
      outline: none;
      font-size: 18px;
    }

    &__icon {
      flex: 0 0 24px;
      cursor: pointer;
    }

    ::v-deep .key {
      border: 1px solid #979797;
      padding: 4px;

      .waves-ripple {
        background-color: rgba(255, 190, 92, 1)
      }
    }
  }
</style>
