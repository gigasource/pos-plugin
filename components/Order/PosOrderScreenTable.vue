<template>
  <div>
    <div class="table-wrapper">
      <g-simple-table striped fixed-header ref="table">
        <thead>
        <tr>
          <th>
            <div class="row-flex" style="line-height: 1.75">
              <span class="flex-grow-1 pa-2 ta-left">{{$t('order.name')}}</span>
              <span class="w-10 pa-2 ta-center">{{$t('order.unit')}}</span>
              <span class="w-10 pa-2 ta-right">{{$t('order.quantity')}}</span>
              <span class="w-12 pa-2 ta-right">{{$t('order.each')}}({{$t('common.currency', storeLocale)}})</span>
              <span class="pa-2 ta-right" style="width: 15%; max-width: 15%">{{$t('common.total')}}({{$t('common.currency', storeLocale)}})</span>
            </div>
          </th>
        </tr>
        </thead>
        <table-expansion-row v-for="(item, index) in formattedProducts"
                             :key="index"
                             :ref="`row_${index}`"
                             v-bind="item"
                             @toggle="toggle(index)"
                             @click:remove="removeItemQuantity(index, $event)"
                             @click:add="addItemQuantity(index)"
        ></table-expansion-row>
        <template v-if="formattedProducts.length < viewportRows">
          <tr v-for="(i, index) in (viewportRows - formattedProducts.length)" :key="`empty_${index}`" class="empty-row">
            <td></td>
          </tr>
        </template>
      </g-simple-table>
    </div>
  </div>
</template>

<script>
  import { nextTick } from 'vue';

  export default {
    name: 'PosOrderScreenTable',
    injectService: ['OrderStore:(currentOrder)', 'PosStore:storeLocale'],
    data() {
      return {
        viewportRows: 0,
      }
    },
    computed: {
      formattedProducts() {
        return this.currentOrder.items.map(item => ({
          ..._.omit(item, 'attributes'),
          attributes: this.getAttributes(item),
          originalTotal: (item.quantity * item.originalPrice).toFixed(2),
          total: (item.quantity * item.price).toFixed(2)
        }))
      }
    },
    methods: {
      getAttributes: item => {
        if (!item.attributes) return
        const attrStringArr = item.attributes.map(attr => `${attr.key}: ${attr.value}`)
        return attrStringArr.join(', ')
      },
      toggle(index) {
        const posStore = this.$getService('OrderStore')
        if (index === posStore.activeTableProduct) {
          posStore.activeTableProduct = undefined
        } else if (!_.isNil(index)) {
          posStore.activeTableProduct = index
        }
      },
      addItemQuantity(index) {
        this.$getService('OrderStore:addItemQuantity')(this.currentOrder.items[index])
      },
      removeItemQuantity(index, removeAll) {
        this.$getService('OrderStore:removeItemQuantity')(this.currentOrder.items[index], removeAll)
      }
    },
    mounted() {
      const orderStore = this.$getService('OrderStore')

      orderStore.$watch('currentOrder.items', (items, oldItems) => {
        if (this.$el) {
          const tableWrapper = this.$el.querySelector('.table-wrapper')
          if (items && items.length > oldItems.length) {
            tableWrapper.scrollTop = items.length >= this.viewportRows
              ? tableWrapper.scrollHeight
              : 0
          }
        }
      }, { deep: true })

      orderStore.$watch('activeTableProduct', (newValue, oldValue) => {
        if (!_.isNil(newValue) && newValue > -1 && this.$refs[`row_${newValue}`].length > 0) {
          this.$refs[`row_${newValue}`][0].$el.classList.add('g-expansion__active')
        }
        if (!_.isNil(oldValue) && oldValue > -1 && this.$refs[`row_${oldValue}`].length > 0) {
          this.$refs[`row_${oldValue}`][0].$el.classList.remove('g-expansion__active')
        }
      })

      orderStore.updateTableRows = (() =>
          nextTick(() => this.viewportRows = Math.floor(this.$el.querySelector('.table-wrapper').clientHeight / 44)))

      orderStore.updateTableRows()
    }
  }
</script>

<style scoped lang="scss">
  .table {
    border: 1px solid #e8e8e8;
    border-radius: 6px;
    font-size: 13px;
    margin: 6px;
    position: relative;

    .empty-row td {
      height: 44px;
    }

    .table-wrapper {
      position: absolute;
      contain: content;
      width: 100%;
      height: 100%;
      overflow: auto;
      border-radius: inherit;

      ::v-deep .g-data-table__wrapper {
        border-radius: inherit;
        overflow: visible;

        table {
          thead th {
            color: inherit;
            padding: 0;
            background-color: white;
          }
        }
      }
    }
  }
</style>
