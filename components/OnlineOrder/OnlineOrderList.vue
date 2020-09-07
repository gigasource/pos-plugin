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
      <span class="fw-700 fs-large mr-3">{{$t('common.currency', storeLocale)}}{{ totalIncome | formatMoney }}</span>
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
            <p>#{{item.id}}</p>
            <g-tooltip :open-on-hover="true" color="#616161" transition="0.3" speech-bubble remove-content-on-close>
              <span><b>From:</b> {{item.forwardedStore}}</span>
              <template v-slot:activator="{on}">
                <div v-on="on" v-if="item.forwardedStore">
                  <g-icon size="16">icon-double-arrow-right_blue</g-icon>
                </div>
              </template>
            </g-tooltip>
          </td>
          <td>
            <p>{{item.customer.name}}</p>
            <p>{{item.customer.phone}}</p>
          </td>
          <td>
            <div v-if="item.customer.address">
              <p>{{item.customer.address}}</p>
              <p>{{item.customer.zipCode}}</p>
            </div>
            <div v-else>--</div>
          </td>
          <td>
            <p class="fw-700">{{$t('common.currency', storeLocale)}}{{item.payment[0].value | formatMoney}}</p>
            <p>{{item.payment[0].type}}</p>
          </td>
          <td>{{item.date | formatDate}}</td>
          <td>{{item.deliveryTime}}</td>
          <td class="fw-700">{{$t(`onlineOrder.${item.type}`)}}</td>
          <td :class="statusClass">
            <div>{{$t(`onlineOrder.${item.status}`)}}</div>
            <div style="font-size: x-small; margin-top: -5px"> {{ isRefunded(item) ? refundedStr: '' }}</div>
          </td>
          <td>
            <!-- ATM, g-menu only contains 1 action so we set this action state as visibility of entire g-menu -->
            <g-menu v-if="isAdminUser && isRefundable(item)" v-model="item.showMenu" :nudge-bottom="10" close-on-content-click>
              <template #activator="{on}">
                <div @click="on.click" :style="moreMenuStyle">···</div>
              </template>
              <template #default>
                <g-card background="white">
                  <div style="padding: 10px; cursor: pointer" @click="$emit('refundOrder', item, status)">{{ refundStr }}</div>
                </g-card>
              </template>
            </g-menu>
          </td>
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
    components: { },
    props: {
      status: String,
      onlineOrders: {
        type: Array,
        default: () => []
      },
      storeLocale: String,
      user: Object,
      isRefundFailed: Function, // (order) => boolean: return refund status of order
      isRefundable: Function, // (order) => boolean: return true if order can be refund
      isRefunded: Function,
      getOnlineOrdersWithStatus: Function,
    },
    data() {
      const i18n = this.$i18n;
      const { onlineOrder: { address, amount, customer, delivery, no, received, status, type, refund, refunded } } = i18n.messages[i18n.locale] || i18n.messages[i18n.fallbackLocale]
      const headers = [no, customer, address, amount, received, delivery, type, status, '']
      return {
        headers,
        refundStr: refund,
        refundedStr: refunded,
        filter: {
          fromDate: '',
          toDate: ''
        }
      }
    },
    filters: {
      formatDate(date) {
        return dayjs(date).format('HH:mm')
      },
      formatMoney(value, decimals = 2) {
        if (value != null)
          return !isNaN(value) ? value.toFixed(decimals) : value
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
      },
      isAdminUser() {
        return this.user.role === "admin"
      },
      moreMenuStyle() {
        const color = '#999'
        return {
          'text-align': 'center',
          'line-height': '18px',
          color: color,
          // border: `1px solid ${color}`,
          'border-radius': '50%',
          width: '20px',
          height: '20px',
          'box-sizing': 'border-box',
          'box-shadow': '0px 0px 3px 0px rgba(0,0,0, 0.6)',
          cursor: 'pointer',
          'background-color': '#fff'
        }
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
          padding: 8px 4px 0;
          vertical-align: top;
          font-size: 14px;
          word-break: break-word;

          &:nth-child(1) {
            width: 6%;
          }

          &:nth-child(2),
          &:nth-child(3) {
            width: 21%;
          }

          &:nth-last-child(-n+6) {
            width: 10%;
          }

          // actions menu
          &:nth-last-child(1) {
            width: 40px;
          }
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
