<template>
  <div class="online-order-list">
    <div style="display: flex; align-items: center">
      <div class="online-order-list__title">
        {{`${$t(`onlineOrder.${status}`)} ${$t('onlineOrder.orders')}`}}
      </div>
      <g-spacer/>
      <template v-if="status === 'completed'">
        <span>Order: <span class="summary-value">{{ totalOrder }}</span></span>
        <span>Total: <span class="summary-value">{{$t('common.currency')}}{{ totalIncome }}</span></span>
        <g-select text-field-component="GTextFieldBs" :width="130" v-model="dateFilter" :items="dateFilters"/>
      </template>
      <div v-else style="height: 54px; width: 1px"></div>
    </div>
    <div class="online-order-list__table">
      <g-table elevation="2" fixed-header>
        <thead>
        <tr>
          <th v-for="header in headers">{{header}}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(item, i) in computedItems" :key="i">
          <td class="fw-700">
            #{{item.id}}
          </td>
          <td>
            <p>{{item.customer.name}}</p>
            <p>{{item.customer.phone}}</p>
          </td>
          <td>
            <div v-if="item.customer.address">
              <p>{{item.customer.address}}</p>
            </div>
            <div v-else>--</div>
          </td>
          <td>
            <p class="fw-700">{{$t('common.currency')}}{{item.payment[0].value}}</p>
            <p>{{item.payment[0].type}}</p>
          </td>
          <td>{{item.date | formatDate}}</td>
          <td>{{item.deliveryTime}}</td>
          <td class="fw-700">{{$t(`onlineOrder.${item.type}`)}}</td>
          <td :class="statusClass">{{$t(`onlineOrder.${item.status}`)}}</td>
        </tr>
        </tbody>
      </g-table>
    </div>
  </div>
</template>

<script>
  import dayjs from 'dayjs'
  import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
  dayjs.extend(isSameOrAfter)
  
  export default {
    name: 'OnlineOrderList',
    injectService: ['OrderStore:getOnlineOrdersWithStatus'],
    props: {
      status: String,
      onlineOrders: {
        type: Array,
        default: () => []
      }
    },
    data() {
      const i18n = this.$i18n;
      const { onlineOrder: { address, amount, customer, delivery, no, received, status, type } } = i18n.messages[i18n.locale] || i18n.messages[i18n.fallbackLocale]

      return {
        headers: [no, customer, address, amount, received, delivery, type, status],
        dateFilter: 'Today',
        dateFilters: _.map(['Today', 'Yesterday', 'Last 3 days', 'Last 7 days', 'Last 30 days'], option => ({ text: option, value: option }))
      }
    },
    filters: {
      formatDate(date) {
        return dayjs(date).format('HH:mm')
      }
    },
    computed: {
      computedItems() {
        const today = dayjs()
        return this.onlineOrders.filter(i => {
          switch (this.dateFilter) {
            case 'Today':
              return dayjs(i.date).isSame(today, 'date')
            case 'Yesterday':
              return dayjs(i.date).isSame(today.subtract(1, 'day'), 'date')
            case 'Last 3 days':
              return dayjs(i.date).isSameOrAfter(today.subtract(3, 'day'), 'date')
            case 'Last 7 days':
              return dayjs(i.date).isSameOrAfter(today.subtract(7, 'day'), 'date')
            case 'Last 30 days':
              return dayjs(i.date).isSameOrAfter(today.subtract(30, 'day'), 'date')
          }
        }).map(i => ({ ...i, status: this.status }))
      },
      statusClass() {
        return this.status
      },
      totalOrder() {
        return this.computedItems.length
      },
      totalIncome() {
        return _.sumBy(this.computedItems, item => item.vSum);
      }
    },
    watch: {
      async status(val) {
        if (!val) return
        await this.getOnlineOrdersWithStatus(this.status)
      }
    },
    async mounted() {
      if (this.status) await this.getOnlineOrdersWithStatus(this.status)
    },
    async activated() {
      if (this.status) await this.getOnlineOrdersWithStatus(this.status)
    },
  }
</script>

<style scoped lang="scss">
  .online-order-list {
    background-image: url('/plugins/pos-plugin/assets/out.png');
    width: 100%;
    height: 100%;
    padding: 16px 16px 24px 16px;

    &__title {
      font-size: 15px;
      font-weight: 700;
      text-transform: capitalize;
    }
  
    .summary-value {
      font-size: 18px;
      color: #1D1D26;
      font-weight: bold;
      margin-right: 15px;
    }

    &__table {
      height: calc(100% - 40px);
      width: 100%;

      .g-table {
        th, td {
          height: 69px;
          padding: 8px 8px 0;
          vertical-align: top;
          font-size: 14px;
        }

        thead th {
          background: #EFEFEF;
          font-size: 12px;
          color: #757575;
          height: 38px;
        }

        tr:nth-child(even) {
          td {
            background: #F8F8FB;
          }
        }

        .completed {
          color: #4CAF50;
          text-transform: capitalize;
        }

        .declined {
          color: #FF5252;
          text-transform: capitalize;
        }
      }
    }
    
    ::v-deep .bs-tf-wrapper {
      margin: 8px 0;
      background-color: #FFF;
      width: 150px;
      
      .bs-tf-label {
        margin-bottom: 0;
      }
    }
  }
</style>
