<template>
  <div class="online-order-list">
    <div class="row-flex align-items-center mb-2">
      <div class="online-order-list__title">
        {{`${$t(`onlineOrder.${status}`)} ${$t('onlineOrder.orders')}`}}
      </div>
      <g-spacer/>
      <span class="text-grey-darken-1 fs-small mr-1">{{$t('onlineOrder.orders')}}:</span>
      <span class="fw-700 fs-large mr-3">{{ totalOrder }}</span>
      <span class="text-grey-darken-1 fs-small mr-1">{{$t('onlineOrder.total')}}:</span>
      <span class="fw-700 fs-large mr-3">{{$t('common.currency')}}{{ totalIncome | formatNumber }}</span>
      <date-range-picker :from="filter.fromDate" :to="filter.toDate" @save="changeFilter"/>
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
  import isBetween from 'dayjs/plugin/isBetween'
  dayjs.extend(isBetween)
  
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
        filter: {
          fromDate: '',
          toDate: ''
        }
      }
    },
    filters: {
      formatDate(date) {
        return dayjs(date).format('HH:mm')
      }
    },
    computed: {
      computedItems() {
        const items = this.onlineOrders.map(i => ({ ...i, status: this.status }))
        if(this.filter.fromDate && this.filter.toDate) {
          return items.filter(item => dayjs(item.date).isBetween(this.filter.fromDate, this.filter.toDate, 'day', '[]'))
        }
        return items
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
      this.filter.fromDate = dayjs().format('YYYY-MM-DD')
      this.filter.toDate = dayjs().format('YYYY-MM-DD')
    },
    async activated() {
      if (this.status) await this.getOnlineOrdersWithStatus(this.status)
    },
    methods: {
      changeFilter(range) {
        this.filter = range
      }
    }
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

    .g-select ::v-deep {
      .bs-tf-label {
        display: none;
      }

      .bs-tf-inner-input-group {
        padding: 0 0 0 8px;
      }

      .input {
        font-size: 14px;
        min-width: 85px;
        text-align: center;
      }
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
