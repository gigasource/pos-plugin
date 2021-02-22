<script>
import {computed, nextTick, ref} from 'vue';
import {actionMap, defaultKeyboard} from './PosOrderKeyboardShared';
import {genScopeId} from "../../utils";
import {addProduct, getCurrentOrder} from "../pos-logic-be";
import {addModifier} from "../pos-logic";

export default {
  props: ['keyboardConfig', 'mode'],
  emits: ['edit:keyboard'],
  setup(props, {emit}) {
    const {keyboardConfig, mode} = props
    const order = getCurrentOrder();
    const productIdQuery = ref(null)
    const productIdQueryResults = ref(null)
    const mainKeyboard = computed(() => {
      const keyboard = _.cloneDeep(defaultKeyboard)
      if (!keyboardConfig.x) {
        const index = keyboard.items.findIndex(k => k.type === 'x')
        if (index > 0) {
          keyboard.items.splice(index, 1)
          const enter = keyboard.items.find(k => k.type === 'enter')
          enter.left--
        }
      }
      return keyboard
    })
    const leftsideItems = computed(() => {
      let keys = [], maxColumns = 0

      for (let i = 0; i < keyboardConfig.layout.length; i++) {
        const rows = keyboardConfig.layout[i].rows
        if (maxColumns < rows.length) maxColumns = rows.length
        for (let j = 0; j < rows.length; j++) {
          if (rows[j].trim() === '') {
            if (mode === 'edit') {
              keys.push({top: i + 1, left: j + 1, bottom: i + 2, right: j + 2, type: 'edit'})
            }
            continue
          }
          const existKey = keys.find(key => key.value === rows[j])
          if (existKey && j + 1 < existKey.right && j + 1 >= existKey.left && i + 1 < existKey.bottom && i + 1 >= existKey.top) continue
          const key = {top: i + 1, left: j + 1, bottom: i + 2, right: j + 2, value: rows[j]}
          let k = j + 1
          //check duplicate in horizontal
          while (k < rows.length) {
            if (rows[k] === rows[j]) {
              key.right++
              k++;
            } else {
              break
            }
          }
          k = i + 1
          //check duplicate in vertical
          while (k < keyboardConfig.layout.length) {
            const nextRows = keyboardConfig.layout[k].rows
            if (nextRows[j] === rows[j]) {
              let flag = false
              if (key.right > key.left + 1) {
                for (let t = key.left; t < key.right; t++) {
                  if (nextRows[t - 1] !== rows[j]) {
                    flag = true
                    break
                  }
                }
              }
              if (!flag) {
                key.bottom++
                k++
              } else {
                break
              }
            } else {
              break
            }
          }
          if (mode === 'edit') {
            key.type = 'edit'
          }
          keys.push(key)
        }
      }
      return {items: keys, rows: keyboardConfig.layout.length, columns: maxColumns}
    })
    const keyboardStyles = computed(() => {
      let styles = {}
      styles['grid-area'] = `${keyboardConfig.top}/${keyboardConfig.left}/${keyboardConfig.top + keyboardConfig.height}/${keyboardConfig.left + keyboardConfig.width}`
      styles['grid-template-rows'] = `repeat(${Math.max(mainKeyboard.value.rows, leftsideItems.value.rows) + 1}, 1fr)`
      styles['grid-template-columns'] = `repeat(${mainKeyboard.value.columns + leftsideItems.value.columns}, 1fr)`
      styles['grid-gap'] = `5px`
      return styles
    })
    const screenStyles = computed(() => ({
      'grid-area': `1/1/2/${mainKeyboard.value.columns + leftsideItems.value.columns + 1}`
    }))

    const keyboardTemplate = computed(() => {
      let template = ''
      template += `grid-area: 2/1/${Math.max(mainKeyboard.value.rows, leftsideItems.value.rows) + 2}/${mainKeyboard.value.columns + leftsideItems.value.columns + 1};`
      template += `grid-template-rows: repeat(${Math.max(mainKeyboard.value.rows, leftsideItems.value.rows)}, 1fr);`
      template += `grid-template-columns: repeat(${mainKeyboard.value.columns + leftsideItems.value.columns}, 1fr);`
      template += `grid-gap: 5px;`
      return template
    })
    const keyboardItems = computed(() => {
      const mainItems = mainKeyboard.value.items.map(item => {
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
        let left = item.left + leftsideItems.value.columns,
            right = item.right + leftsideItems.value.columns,
            style = `grid-area: ${item.top}/${left}/${item.bottom}/${right}`
        Object.assign(key, {style})
        return key
      })
      const extraItems = leftsideItems.value.items.map(item => ({
        content: item.value && [item.value],
        action: item.type !== 'edit' && actionMap.insert,
        style: `grid-area: ${item.top}/${item.left}/${item.bottom}/${item.right}`,
        ...item.type === 'edit' && {
          type: 'edit',
          position: {top: item.top, left: item.left},
          img: !item.value && 'order/add'
        },
      }))
      return [...mainItems, ...extraItems]
    })

    async function queryProductsById() {
      let quantity;
      if (productIdQuery.value.includes('x')) {
        const queryStrArr = productIdQuery.value.split(' ')
        quantity = parseInt(queryStrArr[2]);
        productIdQuery.value = queryStrArr[0]
      }
      const results = cms.getList('Product').filter(item => item.id === productIdQuery.value)
      if (results) {
        productIdQueryResults.value = results.map(product => ({
          ...product,
          originalPrice: product.price,
          ...quantity && { quantity }
        }))
      }
    }

    const clearScreen = function () {
      productIdQuery.value = ''
    }

    const openDialogProductSearchResults = async function () {
      if (mode !== 'active') {
        return
      }
      if (productIdQuery.value.trim()) {
        await queryProductsById()
        if (productIdQueryResults.value.length === 1) {
          const onlyResult = productIdQueryResults.value[0];
          if (onlyResult.attributes == null || (onlyResult.attributes.length === 0 || onlyResult.attributes.keys().length === onlyResult.attributes.length)) {
            if (onlyResult.isModifier) {
              onlyResult.product = onlyResult._id.toString()
              onlyResult.quantity = onlyResult.quantity || 1
              addModifier(order, onlyResult);
            } else {
              addProduct(order, onlyResult);
            }
            productIdQuery.value = ''
            return
          }
        }
        await nextTick(() => {
          emit('openDialogSearch', productIdQuery.value);
        })
      }
    }

    const edit = function (position) {
      emit('edit:keyboard', position)
    }
    return genScopeId(() => <div class="pos-keyboard" style={keyboardStyles.value}>
      <div class="pos-keyboard-screen" style={screenStyles.value}>
        <input class="pos-keyboard-screen__input" v-model={productIdQuery.value}/>
        {productIdQuery.value && <g-icon size="20" onClick={clearScreen}>icon-cancel</g-icon>}
      </div>
      <g-keyboard template={keyboardTemplate.value} items={keyboardItems.value} v-model={productIdQuery.value}
                  onSubmit={openDialogProductSearchResults} onEdit={e => edit(e)}/>
    </div>)
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

  :deep .key {
    border: 1px solid #979797;

    .waves-ripple {
      background-color: rgba(255, 190, 92, 1)
    }
  }
}
</style>
