<script>
import { getInternalValue, Intersect } from 'pos-vue-framework';
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import _ from 'lodash'
import { genScopeId, execGenScopeId } from '../../utils';

export default {
  name: 'dialogProductLookup',
  props: {
    modelValue: Boolean,
  },
  emits: ['update:modelValue'],
  directives: {
    Intersect
  },
  setup(props, context) {
    const internalValue = getInternalValue(props, context);
    let productSliceLength = 15

    const showKeyboard = ref(true)
    const selected = ref(null)

    const lastRowIntersectArgs = ref(null)
    const lastRowIntersectValue = ref(null)
    const directives = computed(() => [
      { name: 'v-intersect', arg: lastRowIntersectArgs.value, value: lastRowIntersectValue.value }
    ])

    /*OrderStore*/ const productNameQuery = ref('')
    /*OrderStore*/ const productNameQueryResults = ref([])
    /*OrderStore*/ async function queryProductsByName() {
      const results = await cms.getModel('Product').filter(product =>
          product.name.toLowerCase().includes(productNameQuery.value.trim().toLowerCase()))
      productNameQueryResults.value = Object.freeze(results.map(product => ({
        ...product,
        originalPrice: product.price
      })))
    }
    /*OrderStore*/ function addProductToOrder() {
      console.error('OrderStore::addProductToOrder not impl')
    }

    const dialogContentRef = ref()
    const tableRef = ref()
    const dialogRef = ref()
    const lastRowRef = ref()

    const productList = computed(() => {
      return _.take(productNameQueryResults.value, productSliceLength)
    })

    function addToOrder(product) {
      addProductToOrder(product)
      selected.value = product
      setTimeout(close, 200)
    }

    function close() {
      internalValue.value = false
      productNameQuery.value = ''
    }

    watch(() => internalValue.value, (newVal) => {
      const listener = e => {
        e.stopPropagation()
        const elements = [
          dialogContent.value.querySelector('.g-tf-wrapper'),
          dialogContent.value.querySelector('.keyboard-wrapper')
        ]
        showKeyboard.value = elements.some(el => el.contains(e.target));
      }

      if (newVal) {
        showKeyboard.value = true
        dialogContent.value.addEventListener('click', listener)
      } else {
        dialogContent.value.removeEventListener('click', listener)
      }
    })

    const updateSearchResult = _.debounce(async (newProductNameQuery) => {
      productNameQuery.value = newProductNameQuery
      await queryProductsByName()
    }, 300)

    onMounted(() => {
      const currentInstance = getCurrentInstance()
      console.log('currentInstance', currentInstance)
      lastRowIntersectArgs.value = { root: currentInstance.$el, threshold: 0.1 }
      lastRowIntersectValue.value = () => productSliceLength += 15
    })

    function renderHeader() {
      return (
          <g-toolbar class="header" color="grey lighten 3" elevation="0">
            <g-text-field-bs
                outlined clearable class="w-50" clear-icon="cancel" style="color: #1d1d26"
                model-value={productNameQuery.value}
                onUpdate:modelValue={updateSearchResult}
                onEnter={queryProductsByName}
                onChange={queryProductsByName}/>
            <g-spacer/>
            <g-btn uppercase={false} icon style="box-shadow: none; border-radius: 50%" onClick={close}>
              <g-icon>clear</g-icon>
            </g-btn>
          </g-toolbar>
      )
    }

    function isNotLastProduct(i) {
      return (i < productList.value.length - 1)
    }

    function renderProductRow(product, i) {
      return <>
        {
          (i === productList.value.length - 1) &&
          <tr key={i}
              class={[(selected.value && product._id === selected.value._id) && 'tr__selected']}
              onClick={() => addToOrder(product)}
              ref={lastRowRef}
              {...{ directives: directives.value }}>
            <td>{product.name}</td>
            <td>{product.barcode ? product.barcode : '-'} </td>
            <td style="text-transform: capitalize">{product.unit ? product.unit : '-'}</td>
            <td>
              {(product.attribute
                  ? <div>
                      {product.attribute.map((val, attr) => <span key={`${attr}_${val}`} class="td-attr">{attr}: {val}</span>)}
                    </div>
                  : <div>-</div>)}
            </td>
          </tr>
        }
        {
          isNotLastProduct(i) &&
          <tr key={i} class={[(selected && product._id === selected._id) && 'tr__selected']}
              onClick={() => addToOrder(product)}>
            <td>{product.name}</td>
            <td>{product.barcode ? product.barcode : '-'}</td>
            <td style="text-transform: capitalize">{product.unit ? product.unit : '-'}</td>
            <td>
              {(product.attribute
                  ? <div>
                      {product.attribute.map((val, attr) => <span key={`${attr}_${val}`} class="td-attr">{attr}: {val}</span>)}
                    </div>
                  : <div>-</div>)}
            </td>
          </tr>
        }
      </>
    }

    function renderProductTable() {
      return (
          <g-simple-table fixed-header class={showKeyboard.value ? 'tbLookup' : 'tbLookup__full'} ref={tableRef}>
            { execGenScopeId(() => <>
              <thead>
              <tr>
                <th>Name</th>
                <th>Barcode</th>
                <th>Unit</th>
                <th>Attribute</th>
              </tr>
              </thead>
              <tbody>
              {productList.value.map(renderProductRow)}
              </tbody>
            </>) }
          </g-simple-table>
      )
    }

    function renderProductSearchKeyboard() {
      return (
          <div v-show={showKeyboard.value} class="keyboard-wrapper">
            <pos-keyboard-full v-model={productNameQuery.value}/>
          </div>
      )
    }

    return genScopeId(() => (
        <g-dialog v-model={internalValue.value} fullscreen ref={dialogRef} eager>
          { execGenScopeId(() =>
              <div class="dialog-lookup w-100" ref={dialogContentRef}>
                {renderHeader()}
                {renderProductTable()}
                {renderProductSearchKeyboard()}
              </div>) }
        </g-dialog>
    ))
  }
}
</script>

<style scoped lang="scss">
.dialog-lookup {
  height: 100vh;
  background-color: white;
  display: flex;
  flex-direction: column;
  border: 16px solid rgba(107, 111, 130, 0.95);

  .g-tf-wrapper fieldset {
    border-radius: 0;
    border: 2px solid #BDBDBD;
  }

  .g-toolbar {
    flex: 0;
  }

  .g-table {
    overflow: scroll;

    &.tbLookup {
      height: calc(65% - 64px) !important;
      flex-basis: calc(65% - 64px);
      flex-grow: 0;
      flex-shrink: 0;

      &__full {
        flex-basis: calc(100% - 64px);
      }
    }

    thead tr th {
      font-size: 13px;
      line-height: 16px;
      color: rgba(29, 29, 38, 0.5);
      background-color: white;
      text-align: left;
    }

    tbody tr td {
      height: 60px;
    }

    .td-attr:not(:last-child) {
      border-right: 1px solid #979797;
      padding-right: 16px;
    }

    .td-attr:not(:first-child) {
      padding-left: 8px;
    }

    .tr__selected {
      td {
        border-top: 1px solid #1271ff !important;
        border-bottom: 1px solid #1271ff !important;
      }

      td:first-child {
        border-left: 1px solid #1271ff !important;
      }

      td:last-child {
        border-right: 1px solid #1271ff !important;
      }
    }
  }

  ::v-deep .keyboard-wrapper {
    flex-basis: 35%;
    height: 35%;
    padding: 16px;
    background-color: #BDBDBD;

    .key {
      border-radius: 0;
      font-size: 24px;
    }
  }
}
</style>
