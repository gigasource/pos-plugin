<template>
  <div style="height: 100%">
    <g-simple-table striped fixed-header>
      <thead>
      <tr>
        <th class="ta-center" @click="openOrderNumberLookup">{{$t('orderHistory.orderNo')}}
          <g-icon size="12">mdi-magnify</g-icon>
        </th>
        <th @click="openDateTimePicker">{{$t('common.datetime')}}
          <g-icon size="12">mdi-filter</g-icon>
        </th>
        <th class="ta-center" @click="dialog.type = true">{{$t('orderHistory.type')}}
          <g-icon size="12">mdi-magnify</g-icon>
        </th>
        <th class="ta-left" @click="dialog.table = true">{{$t('orderHistory.tableNo')}}
          <g-icon size="12">mdi-filter</g-icon>
        </th>
        <th class="ta-right" @click="openAmountFilter">{{$t('orderHistory.amount')}}
          <g-icon size="12">mdi-filter</g-icon>
        </th>
        <th class="ta-center" @click="dialog.payment = true">Payment
          <g-icon size="12">mdi-filter</g-icon>
        </th>
        <th class="ta-left" @click="openStaffFilter">{{$t('orderHistory.staff')}}
          <g-icon size="12">mdi-magnify</g-icon>
        </th>
      </tr>
      </thead>
      <tr v-if="orderHistoryFilters && orderHistoryFilters.length > 0">
        <td colspan="7" class="td__sticky">
          <div class="filter-list">
            <span class="ml-1">{{$t('orderHistory.filter')}}</span>
            <div class="group-chip">
              <g-chip v-for="filter in orderHistoryFilters" :key="filter.title" label small background-color="white" close class="ma-1" @close="removeFilter(filter)">
                <div>
                  <span class="chip-title">{{filter.title}}: </span>
                  <span class="chip-content">{{filter.text}}</span>
                </div>
              </g-chip>
            </div>
            <g-spacer/>
            <g-btn :uppercase="false" text x-small background-color="white" height="24" @click="clearFilters">
              <g-icon svg size="16">icon-cancel3</g-icon>
            </g-btn>
          </div>
        </td>
      </tr>
      <tr v-for="(order, i) in orderHistoryOrders" :key="i" :class="[order._id === orderHistoryCurrentOrder._id && 'tr__active']" @click="chooseOrder(order)">
        <td>
          <div class="ta-center" style="white-space: nowrap; position: relative">
            {{order.id}}
            <g-tooltip :open-on-hover="true" color="#616161" transition="0.3" bottom speech-bubble remove-content-on-close>
              <span><b>From:</b> {{order.forwardedStore}}</span>
              <template v-slot:activator="{on}">
                <div v-on="on" v-if="order.forwardedStore" class="tooltip-forward">
                  <g-icon size="16">icon-delivery-forward</g-icon>
                </div>
              </template>
            </g-tooltip>
          </div>
        </td>
        <td class="ta-center">{{order.dateTime}}</td>
        <td class="ta-center" style="white-space: nowrap; text-transform: capitalize">
          <g-icon v-if="order.type === 'delivery'">icon-delivery-scooter</g-icon>
          <g-icon v-if="order.type === 'pickup'">icon-take-away</g-icon>
          <g-icon v-if="!order.type">icon-cutlery</g-icon>
          <span> {{order.type || 'Dine-in'}}</span>
        </td>
        <td class="ta-left">{{order.table || ''}}</td>
        <td class="ta-right" style="white-space: nowrap">€ {{order.amount.toFixed(2)}}</td>
        <td class="ta-center">
          <template v-if="getOrderPayment(order).icon">
            <g-icon v-if="getOrderPayment(order).multi" size="24" class="mr-2">{{getOrderPayment(order).icon}}</g-icon>
            <img alt v-else :src="getOrderPayment(order).icon" style="width: 24px;" class="mr-2"/>
          </template>
        </td>
        <td>
          <p class="staff-name">{{getStaffName(order.staff)}}</p>
        </td>
      </tr>
    </g-simple-table>
    <pos-table-pagination @execQueryByPage="updatePagination"
                          :total-document="totalOrders"
                          :limit="orderHistoryPagination.limit"
                          @update:limit="updateLimit"
                          :current-page="orderHistoryPagination.currentPage"
                          @update:currentPage="updateCurrentPage"/>
    <dialog-selection-filter v-model="dialog.type" :label="$t('orderHistory.type')" :items="orderTypes" @submit="setTypeFilter"/>
    <dialog-selection-filter v-model="dialog.payment" label="Payment Method" :items="paymentMethods" @submit="setPaymentFilter"/>
    <dialog-number-filter v-model="dialog.table" :label="$t('orderHistory.tableNo')" @submit="setTableFilter"/>
    <dialog-text-filter v-model="dialog.forward" label="Forward Store" @submit="setForwardFilter"/>
  </div>
</template>
<script>
  import _ from 'lodash'
  import dialogSelectionFilter from '../pos-shared-components/dialogFilter/dialogSelectionFilter';
  import dialogNumberFilter from '../pos-shared-components/dialogFilter/dialogNumberFilter';
  import dialogTextFilter from '../pos-shared-components/dialogFilter/dialogTextFilter';
  import posTablePagination from '../pos-shared-components/PosTablePagination';
  
  export default {
    name: 'OrderHistoryTable',
    props: {
      orderHistoryOrders: Array,
      orderHistoryFilters: Object,
      orderHistoryCurrentOrder: Object,
      orderHistoryPagination: Object,
      totalOrders: Number,
    },
    components: {dialogSelectionFilter, dialogNumberFilter, dialogTextFilter, posTablePagination},
    data() {
      return {
        dialog: {
          type: false,
          table: false,
          payment: false,
          forward: false
        },
        orderTypes: [
          {text: 'Delivery', value: 'delivery'},
          {text: 'Pick-up', value: 'pickup'},
          {text: 'Dine-in', value: 'dinein'}
        ],
        paymentMethods: [],
      }
    },
    emits: ['openDialogFilter', 'update:orderHistoryCurrentOrder', 'update:orderHistoryFilters', 'getOrderHistory', 'updateOrderHistoryFilter', 'getTotalOrders', 'update:orderHistoryPagination'],
    methods: {
      openAmountFilter() {
        this.$emit('openDialogFilter', 'amount')
      },
      openBarcodeLookup() {
        this.$emit('openDialogFilter', 'barcode')
      },
      openDateTimePicker() {
        this.$emit('openDialogFilter', 'datetime')
      },
      openStaffFilter() {
        this.$emit('openDialogFilter', 'staff')
      },
      openOrderNumberLookup() {
        this.$emit('openDialogFilter', 'number')
      },
      chooseOrder(order) {
        this.$emit('update:orderHistoryCurrentOrder', order)
      },
      async removeFilter(filter) {
        const filters = _.cloneDeep(this.orderHistoryFilters)
        const index = filters.findIndex(f => f.title === filter.title);
        filters.splice(index, 1);
        this.$emit('update:orderHistoryFilters', filters)
        await this.applyFilter()
      },
      async clearFilters() {
        this.$emit('update:orderHistoryFilters', [])
        await this.applyFilter()
      },
      async updatePagination() {
        await this.$emit('getOrderHistory');
      },
      getStaffName(staffs) {
        return staffs ? staffs.map(s => s.name).join(', ') : ''
      },
      async setTypeFilter(type) {
        const filter = {
          title: this.$t('orderHistory.type'),
          text: this.orderTypes.find(item => item.value === type)['text'],
          condition: type === 'dinein' ? { type: null } : { type }
        }
        await this.applyFilter(filter)
      },
      async setTableFilter(table) {
        const filter = {
          title: this.$t('orderHistory.tableNo'),
          text: table,
          condition: { table }
        }
        await this.applyFilter(filter)
      },
      getPaymentMethods() {
        this.paymentMethods = cms.getList('PosSetting')[0].payment.map(({ name }) => ({
          text: name.charAt(0).toUpperCase() + name.slice(1),
          value: name
        }))
      },
      async setPaymentFilter(payment) {
        await this.applyFilter({
          title: 'Payment Method',
          text: payment,
          condition: { payment: { $elemMatch: { type: payment } } }
        })
      },
      async applyFilter(filter) {
        filter && this.$emit('updateOrderHistoryFilter', filter);
        await this.$emit('getOrderHistory');
        await this.$emit('getTotalOrders');
      },
      getOrderPayment({ payment }) {
        const payments = payment.filter(i => i.type === 'card' || i.type === 'cash')
        if (payments.length > 1) {
          return { icon: 'icon-multi_payment', multi: true }
        }

        const { value, type } = payment[0];
        let paymentMethod = cms.getList('PosSetting')[0].payment.find(i => i.name === type)
        return Object.assign(paymentMethod || {}, { value, type })
      },
      async setForwardFilter(value) {
        const filter = {
          title: 'Forward',
          text: value,
          condition: {'forwardedStore': { '$regex': value, $options: 'i'}}
        }
        this.$emit('updateOrderHistoryFilter', filter);
        await this.$emit('getOrderHistory');
        await this.$emit('getTotalOrders');
      },
      async updateCurrentPage(val) {
        let orderHistoryPagination = _.cloneDeep(this.orderHistoryPagination)
        orderHistoryPagination.currentPage = val
        this.$emit('update:orderHistoryPagination', orderHistoryPagination)
        await this.$emit('getOrderHistory');
      },
      async updateLimit(val) {
        let orderHistoryPagination = _.cloneDeep(this.orderHistoryPagination)
        orderHistoryPagination.limit = val
        this.$emit('update:orderHistoryPagination', orderHistoryPagination)
        await this.$emit('getOrderHistory');
      }
    },
    async created() {
      this.getPaymentMethods()
    },
    async activated() {
      this.getPaymentMethods()
    }
  }
</script>

<style scoped lang="scss">
  .g-table {
    min-height: 0;
    height: calc(100% - 64px);

    ::v-deep .g-data-table__wrapper::-webkit-scrollbar {
      display: none;
    }

    ::v-deep table {
      table-layout: fixed;
    }

    tr th {
      color: #1271ff !important;
      cursor: pointer;
      padding: 0 8px;
      background-color: white;
      font-weight: 700;
      white-space: nowrap;
    }

    tr td {
      height: 33px;
      font-size: 13px;
      line-height: 16px;
      padding: 0 8px;
      border-top: 2px solid transparent;
      border-bottom: 2px solid transparent;

      .staff-name {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
    }

    .td__sticky {
      position: sticky;
      top: 48px;
      background-color: #bdbdbd;
      z-index: 2;
    }

    .tr__active {
      td {
        border-top: 2px solid #1271FF;
        border-bottom: 2px solid #1271FF;
      }

      td:first-child {
        border-left: 2px solid #1271FF;
      }

      td:last-child {
        border-right: 2px solid #1271FF;
      }
    }
  }

  .filter-list {
    display: flex;
    align-items: center;
    padding: 8px;
    font-size: 13px;
    line-height: 16px;
    font-weight: 700;

    .group-chip {
      display: flex;
      flex-wrap: nowrap;
      overflow: auto;
      margin: 0 4px;

      &::-webkit-scrollbar {
        display: none;
      }

      ::v-deep .g-chip {
        overflow: visible;
      }

      .chip-title {
        color: #97A3B4;
        font-weight: 400;
        font-size: 11px;
      }

      .chip-content {
        color: #1D1D26;
        font-weight: 700;
        font-size: 12px;
      }
    }
  }

  .tooltip-forward {
    position: absolute;
    left: 0;
    top: -2px
  }

  @media screen and (max-width: 1023px) {
    .g-table {
      height: calc(100% - 52px);

      tr {
        th {
          font-size: 10px;
          white-space: unset;
          padding: 0 4px;
        }

        td {
          font-size: 11px;
        }
      }
    }

    .tooltip-forward {
      position: static;
    }
  }
</style>
