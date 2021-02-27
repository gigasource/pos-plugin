<script>
import { computed, ref } from 'vue';
import { defaultKeyboard, actionMap} from './PosOrderKeyboardShared';
import { genScopeId } from '../../utils';

export default {
  name: 'PosOrderDeliveryKeyboard',
  props: {
    keyboardConfig: Array,
    mode: String
  },
  setup(props, {emit}) {
    const { keyboardConfig, mode} = props
    const value = ref('')

    const keyboardStyles = computed(() =>{
      let styles = {}
      styles['grid-template-rows'] = `auto repeat(${defaultKeyboard.rows + keyboardConfig.length}, 1fr)`
      styles['grid-template-columns'] = `repeat(${defaultKeyboard.columns}, 1fr)`
      styles['grid-gap'] = `5px`
      return styles
    })
    const screenStyles = computed(() => {
      return {
        'grid-area': `1/1/2/${defaultKeyboard.columns + 1}`
      }
    })
    const keyboardTemplate = computed(() => {
      let template = ''
      template += `grid-area: 2/1/${defaultKeyboard.rows + keyboardConfig.length + 2}/${defaultKeyboard.columns + 1};`
      template += `grid-template-rows: repeat(${defaultKeyboard.rows + keyboardConfig.length}, 1fr);`
      template += `grid-template-columns: repeat(${defaultKeyboard.columns}, 1fr);`
      template += `grid-gap: 5px;`
      return template
    })
    const keyboardItems = computed(() =>{
      let upperItems = []
      for(let i = 0; i < keyboardConfig.length; i++) {
        const rows = keyboardConfig[i]
        for (let j = 0; j < rows.length; j++) {
          let key = {
            'grid-area': `${i+1}/${j+1}/${i+2}/${j+2}`
          }
          if(mode === 'edit') {
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
        let top = item.top + keyboardConfig.length,
            bottom = item.bottom + keyboardConfig.length,
            style = `grid-area: ${top}/${item.left}/${bottom}/${item.right}`
        Object.assign(key, {style})
        return key
      })
      return [...upperItems, ...defaultItems]
    })

    const clear = function() {
      value.value = ''
    }
    const submit = function() {
      emit('submit', value.value)
      clear()
    }
    const editKeyboard = function(position) {
      emit('edit:keyboard', position)
    }

    return genScopeId(() => <div class="delivery-keyboard" style={keyboardStyles.value}>
      <div class="delivery-keyboard__screen" style={screenStyles.value}>
        <input class="delivery-keyboard__input" v-model={value.value}/>
        <g-icon color="#FF4552" class="delivery-keyboard__icon" onClick={clear}>cancel</g-icon>
      </div>
      <g-keyboard v-model={value.value} items={keyboardItems.value} template={keyboardTemplate.value} onSubmit={submit} onEdit={editKeyboard}/>
    </div>)
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
