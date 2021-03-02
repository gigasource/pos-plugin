<script>
import _ from 'lodash'
import { computed, ref, withModifiers } from 'vue'
import { execGenScopeId, genScopeId } from '../../../utils';

export default {
  name: 'dialogProductSearchResult',
  props: {
    modelValue: null,
    productIdQuery: String,
    productIdQueryResults: Array
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const activeClass = 'active-attribute'
    const queryResults = ref([])

    /*OrderStore*/
    function addModifierToProduct() {
      console.error('OrderStore::addModifierToProduct')
    }

    /*OrderStore*/
    function addProductToOrder() {
      console.error('OrderStore::addProductToOrder')
    }

    const dialogProductSearch = computed({
      get() {
        return props.modelValue;
      },
      set(value) {
        emit('update:modelValue', value);
      }
    })
    const formattedQueryResults = computed({
      get() {
        if (productIdQueryResults.value) {
          queryResults.value = productIdQueryResults.value.map(result => {
            let hasAttributes = result.attributes && result.attributes.length;
            const computedAttributes = hasAttributes && _.groupBy(result.attributes, 'key')
            let selectedAttributes = {};

            if (hasAttributes) {
              for (const key in computedAttributes) {
                if (computedAttributes.hasOwnProperty(key))
                  Object.assign(selectedAttributes, { [key]: undefined })
              }
            }

            return {
              _id: result._id,
              id: result.id,
              name: result.name,
              ...result.unit && { unit: Array.isArray(result.unit) ? result.unit : [result.unit] },
              ...result.unit && { selectedUnit: Array.isArray(result.unit) ? result.unit[0] : result.unit },
              ...hasAttributes && { attributes: computedAttributes },
              ...hasAttributes && { selectedAttributes }
            }
          })
        }
        return queryResults.value
      },
      set(value) {
        queryResults.value = value
      }
    })

    function isValidItem({ selectedAttributes, selectedUnit, unit }) {
      if (selectedAttributes) {
        for (const key in selectedAttributes) {
          if (selectedAttributes.hasOwnProperty(key) && !selectedAttributes[key]) return false
        }
      }
      if (unit)
        return !!selectedUnit;
      return true
    }

    function _addProductToOrder(product) {
      const _product = _.clone(productIdQueryResults.value.find(i => i._id === product._id))
      _product.unit = product.selectedUnit
      _product.attributes = _.values(product.selectedAttributes)
      if (_product.isModifier) {
        addModifierToProduct(_product)
      } else {
        addProductToOrder(_product)
      }
      closeDialog()
    }

    function closeDialog() {
      dialogProductSearch.value = false
    }

    function renderHeader() {
      return (
          <g-card-title>
            { execGenScopeId(() => <>
              {formattedQueryResults.value.length} {formattedQueryResults.value.length > 1 ? 'results' : 'result'} for product id "{productIdQuery.value}"
              <g-spacer/>
              <g-btn uppercase={false} onClick={closeDialog} icon>
                <g-icon>close</g-icon>
              </g-btn>
            </>) }
          </g-card-title>
      )
    }
    function renderProduct(product, index) {
      return (
          <tr key={index}>
            <td>
              <div class="result-item result-item-product" style="display: flex;">
                <div style="display: flex; justify-content: center; align-items: center;">
                  <p>{index + 1}</p>
                </div>
                <div style="display: flex; justify-content: center; align-items: center; flex: 1">
                  <div style="padding: 20px;">
                    <div><p>#{product.id}</p></div>
                    <div><p><b>{product.name}</b></p></div>
                  </div>
                </div>
              </div>
            </td>
            <td>
              <div class="result-item result-item-unit">
                <div style="display: flex; justify-content: center; align-items: center;">
                  <g-item-group items={product.unit} v-model={product.selectedUnit} v-slots={{
                    item: ({ item, toggle, active }) => execGenScopeId(() =>
                      <g-badge overlay style="margin: 12px 12px 12px 0 !important" modelValue={active} badge-size="14" v-slots={{
                        default: () => execGenScopeId(() => <g-btn
                            uppercase={false} onClick={() => toggle(item)}
                            outlined style="margin-left: 5px" active={active}
                            class={active ? activeClass : null}>{item}</g-btn>),
                        badge: () => execGenScopeId(() =>
                            <g-icon style="font-size: 13px ;font-weight: bold">done</g-icon>),
                      }}/>
                    ),
                  }}/>
                </div>
              </div>
            </td>
            <td style="width: 50%">
              {
                (product.attributes) &&
                <div class="result-item result-item-attribute">
                  {product.attributes.map((attributes, key) =>
                      <div class="result-item-attribute-row">
                        <div class="attribute-title"><span>{key}</span></div>
                        <g-item-group items={attributes} v-model={product.selectedAttributes[key]} v-slots={{
                          item: ({ item, toggle, active }) => execGenScopeId(() =>
                              <g-badge overlay style="margin: 12px 12px 12px 0 !important" modelValue={active} badge-size="14" v-slots={{
                                default: () => execGenScopeId(() => <g-btn
                                    uppercase={false} onClick={() => toggle(item)} outlined
                                    style="margin-left: 5px" active={active} class={[active ? activeClass : {}]}>
                                  {item.value}
                                </g-btn>),
                                badge: () => execGenScopeId(() => <g-icon style="font-size: 13px ;font-weight: bold">done</g-icon>)
                              }}/>
                          ),
                        }}/>
                      </div>
                  )} </div>
              }
            </td>
            <td>
              <div class="result-item result-item-action" style="display: flex; justify-content: center; align-items: center;">
                <g-btn uppercase={false} disabled={!isValidItem(product)} background-color="blue darken-1"
                       text-color="white" onClick={withModifiers(() => _addProductToOrder(product), ['stop'])}>
                  <g-icon class="mr-1" size="20">add_circle</g-icon>
                  Add
                </g-btn>
              </div>
            </td>
          </tr>
      )
    }
    function renderSearchResult() {
      return (<g-simple-table fixed-header height="500px" striped>
        {execGenScopeId(() => <>
          <thead>
          <tr class="search-table-row">
            <th class="text-left">Product</th>
            <th class="text-left">Unit</th>
            <th class="text-left">Attribute</th>
            <th></th>
          </tr>
          </thead>
          <tbody>
          {formattedQueryResults.value.map(renderProduct)}
          </tbody>
        </>)}
      </g-simple-table>)
    }

    return genScopeId(() => <>
      <g-dialog v-model={dialogProductSearch} eager>
        {execGenScopeId(() =>
            <g-card style="height: 568px">
              {execGenScopeId(() =>
                  <div>
                    {renderHeader()}
                    {renderSearchResult()}
                  </div>
              )}
            </g-card>
        )}
      </g-dialog>
    </>)
  },
}
</script>

<style scoped lang="scss">
::v-deep .g-badge {
  padding: 0;
  transform: translate(calc(50% - 1px), calc(-50% + 1px)) !important;
}

.result-item-unit {
  justify-content: center;
}

.result-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  .result-item-attribute-row {
    display: flex;
    flex-basis: 100%;
    padding: 5px;
  }

  .active-attribute {
    border: 2px solid #1E88E5;
  }

  .attribute-title {
    width: 50px;
    display: flex;
    flex-shrink: 0;
    justify-content: center;
    align-items: center;
  }
}

.g-card-title {
  font-size: 16px !important;
  line-height: 20px !important;
}

::v-deep .g-badge-wrapper {
  margin: 12px 12px 0 0 !important;
}

.g-item-group {
  flex-wrap: wrap;
}

.g-card {
  width: 88vw;
  overflow-y: hidden !important;
}

th {
  background-color: #E0E0E0;
  font-size: 14px !important;
  color: #000000 !important;
  font-weight: normal;
  line-height: 18px;
}

td {
  text-transform: capitalize;

  .g-btn {
    text-transform: capitalize;
  }
}

.g-badge-wrapper .g-btn {
  min-width: 0 !important;
}
</style>
