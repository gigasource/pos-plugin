<template>
  <div class="online-order-list">
    <div class="row-flex align-items-center mb-2">
      <div class="online-order-list__title">
        {{ `${$t(`onlineOrder.${status}`)} ${$t('onlineOrder.orders')}` }}
      </div>
      <g-spacer/>
      <div class="online-order-list__info">
        <div class="row-flex align-items-center">
          <g-icon class="mr-2" size="20">icon-cutleries2</g-icon>
          <span class="fw-700">{{ totalOrder }}</span>
        </div>
        <div class="row-flex align-items-center">
          <g-icon class="mr-2" size="20">icon-money-bag</g-icon>
          <span class="fw-700">{{ $t('common.currency', storeLocale) }}{{ $filters.formatCurrency(totalIncome) }}</span>
        </div>
      </div>
      <date-range-picker :from="filter.fromDate" :to="filter.toDate" @save="changeFilter"/>
    </div>
    <div class="online-order-list__table">
      <g-table elevation="2" fixed-header>
        <thead>
        <tr>
          <th style="white-space: nowrap" v-for="header in headers">{{ header }}</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(item, i) in computedItems" :key="i" @click="openDialogDetail(item)">
          <td class="fw-700">
            <p style="white-space: nowrap">#{{ item.dailyId ? item.dailyId : item.id }}</p>
            <g-tooltip :open-on-hover="true" color="#616161" transition="0.3" speech-bubble remove-content-on-close>
              <span><b>From:</b> {{ item.forwardedStore }}</span>
              <template v-slot:activator="{on}">
                <div v-on="on" v-if="item.forwardedStore">
                  <g-icon size="16">icon-delivery-forward</g-icon>
                </div>
              </template>
            </g-tooltip>
          </td>
          <td>
            <p>{{ item.customer.name }}</p>
            <p style="white-space: nowrap">{{ item.customer.phone }}</p>
          </td>
          <td>
            <div v-if="item.customer.address">
              <p style="word-break: break-word">{{ item.customer.address }}</p>
              <p>{{ item.customer.zipCode }}</p>
            </div>
            <div v-else>--</div>
          </td>
          <td>
            <p class="fw-700" style="white-space: nowrap">
              {{ $t('common.currency', storeLocale) }}{{ $filters.formatCurrency(item.payment[0].value) }}
            </p>
            <p>
              <img alt :src="getImagePayment(item.payment[0].type)">
            </p>
          </td>
          <td style="white-space: nowrap">{{ formatDate(item.date) }}</td>
          <td style="white-space: nowrap">{{ item.deliveryTime }}</td>
          <td>
            <g-icon v-if="item.type === 'delivery'">icon-delivery-scooter</g-icon>
            <g-icon v-if="item.type === 'pickup'">icon-take-away</g-icon>
          </td>
          <td :class="statusClass">
            <div style="white-space: nowrap">{{ $t(`onlineOrder.${item.status}`) }}</div>
            <div style="font-size: x-small; margin-top: -5px"> {{ isRefunded(item) ? refundedStr : '' }}</div>
          </td>
          <td>
            <!-- ATM, g-menu only contains 1 action so we set this action state as visibility of entire g-menu -->
            <g-menu v-if="isAdminUser && isRefundable(item)" v-model="item.showMenu" :nudge-bottom="10" close-on-content-click>
              <template #activator="{on}">
                <div @click="on.click" :style="moreMenuStyle">···</div>
              </template>
              <template #default>
                <g-card background="white">
                  <div style="padding: 10px; cursor: pointer" @click="$emit('refundOrder', item, status)">{{
                      refundStr
                    }}
                  </div>
                </g-card>
              </template>
            </g-menu>
          </td>
        </tr>
        </tbody>
      </g-table>
    </div>
    <dialog-complete-order disabled-btn ref="dialog" v-model="dialog"/>
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
    emits: ['refundOrder'],
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
        },
        dialog: false
      }
    },
    computed: {
      computedItems() {
        const items = this.onlineOrders.map(i => ({ ...i, status: this.status }))
        if(this.filter.fromDate && this.filter.toDate) {
          return items.filter(item => dayjs(item.date).isBetween(this.filter.fromDate, this.filter.toDate, 'day', '[]'))
        }
        return []
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
      },
      getImagePayment(type) {
        let paymentMethod = cms.getList('PosSetting')[0].payment.find(i => i.name === type)
        return paymentMethod && paymentMethod.icon
      },
      openDialogDetail(item) {
        this.$refs.dialog.showDialog(item)
      },
      formatDate(date) {
        if (!date || !dayjs(date).isValid()) return ''
        return dayjs(date).format('HH:mm')
      },
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

    &__info {
      display: flex;
      align-items: center;
      margin-right: 16px;
      background-color: #fff;
      border: 1px solid #E0E0E0;
      border-radius: 4px;

      & > div:first-child {
        border-right: 1px solid #E0E0E0;
      }

      div {
        padding: 5px 8px;
      }
    }

    &__table {
      height: calc(100% - 40px);
      width: 100%;

      .g-table {
        th, td {
          height: auto;
          padding: 8px 4px;
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

  @media screen and (max-width: 1023px) {
    .online-order-list {

      &__table {
        .g-table td {
          font-size: 12px;
        }
      }
    }
  }

</style>
