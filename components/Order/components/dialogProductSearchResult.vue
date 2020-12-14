<template>
  <g-dialog v-model="dialogProductSearch"  eager>
    <g-card style="height: 568px">
      <g-card-title>
        {{formattedQueryResults.length}} {{formattedQueryResults.length > 1 ? 'results' : 'result'}} for product id "{{productIdQuery}}"
        <g-spacer></g-spacer>
        <g-btn :uppercase="false" @click="closeDialog" icon>
          <g-icon>close</g-icon>
        </g-btn>
      </g-card-title>
      <g-simple-table fixed-header height="500px" striped>
        <template>
          <thead>
          <tr class="search-table-row">
            <th class="text-left">Product</th>
            <th class="text-left">Unit</th>
            <th class="text-left">Attribute</th>
            <th></th>
          </tr>
          </thead>
          <tbody>
          <tr :key="index" v-for="(product, index) in formattedQueryResults">
            <td>
              <div class="result-item result-item-product" style="display: flex;">
                <div style="display: flex; justify-content: center; align-items: center;">
                  <p>{{index + 1}}</p>
                </div>
                <div style="display: flex; justify-content: center; align-items: center; flex: 1">
                  <div style="padding: 20px;">
                    <div><p>#{{product.id}}</p></div>
                    <div><p><b>{{product.name}}</b></p></div>
                  </div>
                </div>
              </div>
            </td>
            <td>
              <div class="result-item result-item-unit">
                <div style="display: flex; justify-content: center; align-items: center;">
                  <g-item-group :items="product.unit" v-model="product.selectedUnit">
                    <template v-slot:item="{item, toggle, active}">
                      <g-badge overlay style="margin: 12px 12px 12px 0 !important" :value="active" badge-size="14">
                        <template v-slot:badge>
                          <g-icon style="font-size: 13px ;font-weight: bold">done</g-icon>
                        </template>
                      <g-btn :uppercase="false" @click="toggle(item)" outlined style="margin-left: 5px" :active="active" :class="[active ? activeClass : {}]">
                        {{item}}
                      </g-btn>
                      </g-badge>
                    </template>
                  </g-item-group>
                </div>
              </div>
            </td>
            <td style="width: 50%">
              <div class="result-item result-item-attribute" v-if="product.attributes">
                <div class="result-item-attribute-row" v-for="(attributes, key) in product.attributes">
                  <div class="attribute-title">
                    <span>
                      {{key}}
                    </span>
                  </div>
                  <g-item-group :items="attributes"
                                v-model="product.selectedAttributes[key]"
                  >
                    <template v-slot:item="{item, toggle, active}">
                      <g-badge overlay style="margin: 12px 12px 12px 0 !important" :value="active" badge-size="14">
                        <template v-slot:badge>
                          <g-icon style="font-size: 13px ;font-weight: bold">done</g-icon>
                        </template>
                        <g-btn :uppercase="false" @click="toggle(item)" outlined style="margin-left: 5px" :active="active" :class="[active ? activeClass : {}]">
                          {{item.value}}
                        </g-btn>
                      </g-badge>
                    </template>
                  </g-item-group>
                </div>
              </div>
            </td>
            <td>
              <div class="result-item result-item-action" style="display: flex; justify-content: center; align-items: center;">
                <g-btn :uppercase="false" :disabled="!isValidItem(product)"
                       background-color="blue darken-1"
                       text-color="white"
                       @click.stop="addProductToOrder(product)"
                >
                  <g-icon class="mr-1" size="20">add_circle</g-icon>
                  Add
                </g-btn>
              </div>
            </td>
          </tr>
          </tbody>
        </template>
      </g-simple-table>
    </g-card>
  </g-dialog>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: 'dialogProductSearchResult',
    props: {
      value: null
    },
    injectService: ['OrderStore:(productIdQuery,productIdQueryResults)'],
    data: () => ({
      activeClass: 'active-attribute',
      queryResults: []
    }),
    computed: {
      dialogProductSearch: {
        get() {
          return this.value;
        },
        set(value) {
          this.$emit('input', value);
        }
      },
      formattedQueryResults: {
        get() {
          if (this.productIdQueryResults) {
            this.queryResults = this.productIdQueryResults.map(result => {
              let hasAttributes = result.attributes && result.attributes.length;
              const computedAttributes = hasAttributes && _.groupBy(result.attributes, 'key')
              let selectedAttributes = {};

              if (hasAttributes) {
                for (const key in computedAttributes) {
                  if (computedAttributes.hasOwnProperty(key)) Object.assign(selectedAttributes, {[key]: undefined})
                }
              }

              return {
                _id: result._id,
                id: result.id,
                name: result.name,
                ...result.unit && { unit: Array.isArray(result.unit) ? result.unit : [result.unit]},
                ...result.unit && {selectedUnit: Array.isArray(result.unit) ? result.unit[0] : result.unit},
                ...hasAttributes && { attributes: computedAttributes },
                ...hasAttributes && { selectedAttributes }
              }
            })
          }
          return this.queryResults
        },
        set(value) {
          this.queryResults = value
        }
      },
    },
    methods: {
      isValidItem({ selectedAttributes, selectedUnit, unit }) {
        if (selectedAttributes) {
          for (const key in selectedAttributes) {
            if (selectedAttributes.hasOwnProperty(key) && !selectedAttributes[key]) return false
          }
        }
        if (unit) return !!selectedUnit;
        return true
      },
      addProductToOrder(product) {
        const _product = _.clone(this.productIdQueryResults.find(i => i._id === product._id))
        _product.unit = product.selectedUnit
        _product.attributes = _.values(product.selectedAttributes)
        if (_product.isModifier) {
          this.$getService('OrderStore:addModifierToProduct')(_product)
        } else {
          this.$getService('OrderStore:addProductToOrder')(_product)
        }
        this.dialogProductSearch = false
        this.productIdQuery = ''
      },
      closeDialog() {
        this.dialogProductSearch = false
        this.productIdQuery = ''
      }
    }
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
