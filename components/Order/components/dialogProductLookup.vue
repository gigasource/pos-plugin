<template>
  <g-dialog v-model="dialogProductLookup" fullscreen ref="dialog" domain="TestDialog2" eager>
    <div class="dialog-lookup w-100" ref="dialogContent">
      <g-toolbar class="header" color="grey lighten 3" elevation="0">
        <g-text-field outlined clearable class="w-50" clear-icon="cancel"
                      style="color: #1d1d26"
                      v-model="productNameQuery"
                      @enter="queryProductsByName"
                      @change="queryProductsByName"
        ></g-text-field>
        <g-spacer></g-spacer>
        <g-btn :uppercase="false" icon style="box-shadow: none; border-radius: 50%" @click="close">
          <g-icon>clear</g-icon>
        </g-btn>
      </g-toolbar>
      <g-simple-table fixed-header :class="tbLookup" ref="table">
        <thead>
        <tr>
          <th>Name</th>
          <th>Barcode</th>
          <th>Unit</th>
          <th>Attribute</th>
        </tr>
        </thead>
        <tbody>
        <template v-for="(product, i) in productList">
          <tr :key="i"
              :class="[(selected && product._id === selected._id) && 'tr__selected']"
              @click="addToOrder(product)"
              v-if="i < productList.length - 1"
          >
            <td>{{product.name}}</td>
            <td>{{product.barcode ? product.barcode : '-'}}</td>
            <td style="text-transform: capitalize">{{product.unit ? product.unit : '-'}}</td>
            <td>
              <div v-if="product.attribute">
                <span v-for="(val, attr) in product.attribute" :key="`${attr}_${val}`" class="td-attr">
                  {{attr}}: {{val}}
                </span>
              </div>
              <div v-else>-</div>
            </td>
          </tr>
          
          <tr :key="i"
              :class="[(selected && product._id === selected._id) && 'tr__selected']"
              @click="addToOrder(product)"
              v-if="i === productList.length - 1"
              ref="lastRow"
              v-intersect:[lastRowIntersectArgs]="lastRowIntersectValue"
          >
            <td>{{product.name}}</td>
            <td>{{product.barcode ? product.barcode : '-'}}</td>
            <td style="text-transform: capitalize">{{product.unit ? product.unit : '-'}}</td>
            <td>
              <div v-if="product.attribute">
                <span v-for="(val, attr) in product.attribute" :key="`${attr}_${val}`" class="td-attr">
                  {{attr}}: {{val}}
                </span>
              </div>
              <div v-else>-</div>
            </td>
          </tr>
        </template>
        </tbody>
      </g-simple-table>
      <div v-show="showKeyboard" class="keyboard-wrapper">
        <pos-keyboard-full v-model="productNameQuery"/>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  import { getInternalValue, Intersect } from 'pos-vue-framework';
  import PosKeyboardFull from '../../pos-shared-components/PosKeyboardFull';

  export default {
    name: 'dialogProductLookup',
    injectService: ['OrderStore:(productNameQuery,productNameQueryResults,queryProductsByName,addProductToOrder)'],
    components: {PosKeyboardFull},
    props: {
      value: Boolean,
    },
    directives: {
      Intersect
    },
    data() {
      return {
        showKeyboard: true,
        selected: null,
        productSliceLength: 15,
        lastRowIntersectArgs: null,
        lastRowIntersectValue: null,
      }
    },
    methods: {
      open() {
        this.dialogProductLookup = true;
      },
      addToOrder(product) {
        this.addProductToOrder(product)
        this.selected = product
        setTimeout(this.close, 200)
      },
      close() {
        this.dialogProductLookup = false
        this.productNameQuery = ''
      }
    },
    setup() {
      const dialogProductLookup = getInternalValue(...arguments);
      return { dialogProductLookup };
    },
    computed: {
      productList() {
        return _.take(this.productNameQueryResults, this.productSliceLength)
      },
      tbLookup() {
        return this.showKeyboard ? 'tbLookup' : 'tbLookup__full'
      },
    },
    created() {
      const orderStore = this.$getService('OrderStore')
      orderStore.$watch('productNameQuery', () => {
        this.queryProductsByName()
      }, { immediate: true })

      this.productNameQuery = ''
      this.lastRowIntersectArgs = { root: this.$el, threshold: 0.1 }
      this.lastRowIntersectValue = () => this.productSliceLength += 15
    },
    watch: {
      dialogProductLookup(newVal) {
        const listener = e => {
          e.stopPropagation()
          const elements = [
            this.$refs.dialogContent.querySelector('.g-tf-wrapper'),
            this.$refs.dialogContent.querySelector('.keyboard-wrapper')
          ]
          this.showKeyboard = elements.some(el => el.contains(e.target));
        }

        if (newVal) {
          this.showKeyboard = true
          this.$refs.dialogContent.addEventListener('click', listener)
        }
        !newVal && this.$refs.dialogContent.removeEventListener('click', listener)
      }
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
