<template>
  <div class="staff-report-dialog">
    <div class="staff-report-content">
      <g-tabs :items="staffs"
              :show-arrows="false"
              :vertical="true"
              color='#F2F2F2'
              slider-color="#2979FF"
              slider-size="4px"
              text-color="#000000"
              v-if="staffs.length"
              v-model="selectedStaff"
      >
        <g-tab-item :item="item" :key="i" v-for="(item, i) in staffs">
          <div class="detail-header">{{ $t('report.staffName') }}: {{ item.name }}</div>
          <div v-if="orderSalesByStaff && orderSalesByStaff.user[orderSalesByStaff.name]">
            <div class="detail-header">{{ $t('report.reportDate') }}: {{ reportDate }}</div>
            <div class="detail-time">{{ $t('report.firstOrder') }}:
              {{ getFormattedTime(orderSalesByStaff.user[orderSalesByStaff.name].from) }}
            </div>
            <div class="detail-time">{{ $t('report.lastOrder') }}:
              {{ getFormattedTime(orderSalesByStaff.user[orderSalesByStaff.name].to) }}
            </div>
          </div>

          <div class="sales-details-header">{{ $t('common.sales') }}</div>
          <div v-if="orderSalesByStaff && orderSalesByStaff.user[orderSalesByStaff.name]">
            <p>
              <span class="sales-entry sales-type">{{ $t('common.total') }}</span>
              <span class="sales-entry sales-amount">{{
                  $filters.formatCurrency(orderSalesByStaff.user[orderSalesByStaff.name].vSum)
                }}</span></p>
            <p>
              <span class="sales-entry sales-type">{{ $t('common.subtotal') }}</span>
              <span class="sales-entry sales-amount">{{
                  $filters.formatCurrency(orderSalesByStaff.user[orderSalesByStaff.name].net)
                }}</span>
            </p>
            <p>
              <span class="sales-entry sales-type">{{ $t('common.tax') }}</span>
              <span class="sales-entry sales-amount">{{
                  $filters.formatCurrency(orderSalesByStaff.user[orderSalesByStaff.name].tax)
                }}</span></p>
          </div>

          <div class="tax-detail">
            <div v-if="orderSalesByStaff && orderSalesByStaff['groupByTax']">
              <div v-for="(entry, key, index) in orderSalesByStaff['groupByTax']">
                <p class="sales-entry sales-type">{{ $t('common.tax') }} {{ key }}%:</p>
                <p>
                  <span class="sales-entry sales-type">{{ $t('common.total') }}</span>
                  <span class="sales-entry sales-amount">{{ $filters.formatCurrency(entry.gross) }}</span>
                </p>
                <p>
                  <span class="sales-entry sales-type">{{ $t('common.subtotal') }}</span>
                  <span class="sales-entry sales-amount">{{ $filters.formatCurrency(entry.net) }}</span>
                </p>
                <p>
                  <span class="sales-entry sales-type">{{ $t('common.tax') }}</span>
                  <span class="sales-entry sales-amount">{{ $filters.formatCurrency(entry.salesTax) }}</span>
                </p>
                <br/>
              </div>
            </div>
            <div v-if="orderSalesByStaff && orderSalesByStaff.user[orderSalesByStaff.name]">
              <p><span class="sales-entry sales-type">{{ $t('report.vouchersSold') }}</span>
                <span class="sales-entry sales-amount">0.00</span></p>
              <p><span class="sales-entry sales-type">{{ $t('report.vouchersUsed') }}</span>
                <span class="sales-entry sales-amount">0.00</span></p>
              <p>
                <span class="sales-entry sales-type">{{ $t('common.discount') }}</span>
                <span class="sales-entry sales-amount">{{
                    $filters.formatCurrency(orderSalesByStaff.user[orderSalesByStaff.name].discount)
                  }}</span>
              </p>
            </div>
          </div>
          <div class="sales-details" v-if="orderSalesByStaff && orderSalesByStaff['groupByPayment']">
            <p :key="index" v-for="(sale, key, index) in orderSalesByStaff['groupByPayment']">
              <span class="sales-entry sales-type">{{ key }} {{ $t('common.sales') }}: </span><span class="sales-entry">{{ $filters.formatCurrency(sale) }}</span>
            </p>
            <p><span class="sales-entry sales-type">{{ $t('report.returnedTotal') }}: </span> <span class="sales-entry">{{ 0 }}</span>
            </p>
          </div>
        </g-tab-item>
        <template #tab="{item, index}">
          <g-tab :item="item" :key="index" active-text-color="#000000">
            <p class="tab-username">{{ item.name }}</p>
          </g-tab>
        </template>
      </g-tabs>
    </div>

    <g-toolbar bottom color="#EEEEEE">
      <g-btn :uppercase="false" @click="back" width="94px">
        <g-icon class="mr-2" svg>icon-back</g-icon>
        {{ $t('ui.back') }}
      </g-btn>
      <g-spacer/>
      <g-btn :uppercase="false" @click="print" background-color="#2979FF" text-color="#FFFFFF">
        <g-icon class="mr-2" svg>icon-print2</g-icon>
        {{ $t('report.printReport') }}
      </g-btn>
    </g-toolbar>
  </div>

</template>

<script>
  import _ from 'lodash'
  import dayjs from 'dayjs'

  export default {
    name: 'PosStaffReportDialog',
    props: {
      value: null
    },
    injectService: [
      'PosStore:(systemDate, dateFormat, timeFormat)',
      'ReportsStore:(getOrderSalesByStaff, printStaffReport)',
      'SettingsStore:(getListUsers, listUsers)'
    ],
    data: () => ({
      selectedStaff: null,
      staffs: [],
      orderSalesByStaff: null,
    }),
    computed: {
      reportDate() {
        return dayjs(this.systemDate).format(this.dateFormat)
      }
    },
    watch: {
      selectedStaff: {
        handler: async function (newVal) {
          if (!newVal) {
            return []
          }
          this.orderSalesByStaff = await this.getOrderSalesByStaff(newVal.name, this.systemDate)
        },
        sync: true
      }
    },
    methods: {
      back() {
        this.$router.push({ path: '/pos-dashboard' })
      },
      async print() {
        if (!this.orderSalesByStaff) {
          return
        }
        return await this.printStaffReport(this.orderSalesByStaff)
      },
      getFormattedTime(val) {
        return val ? dayjs(val).format(`${this.dateFormat} ${this.timeFormat}`) : ''
      }
    },
    async mounted() {
      await this.getListUsers();
      this.staffs = this.listUsers;
      this.selectedStaff = this.staffs.length && this.staffs[0]
    },
    async activated() {
      await this.getListUsers();
      this.staffs = this.listUsers;
      this.selectedStaff = this.staffs.length && this.staffs[0]
    }
  }
</script>

<style lang="scss" scoped>
  .staff-report-dialog {
    width: 100%;
    background-color: #fff;
    position: relative;
    height: 100%;

    .staff-report-content {
      height: 100%;

      .detail-header {
        font-weight: bold;
        font-size: 16px;
        line-height: 27px;
      }

      .detail-time {
        font-size: 14px;
        line-height: 25px;
        font-family: "Muli", sans-serif;
      }

      .sales-details {
        border-top: 1px dashed #000000;
      }

      .sales-details-header {
        font-weight: bold;
        font-size: 16px;
        line-height: 33px;
        border-top: 1px dashed #000000;
      }

      .tax-detail {
        border-top: 1px dashed #000000;
      }

      .sales-entry {
        font-size: 14px;
        line-height: 25px;
      }

      .sales-type {
        text-transform: capitalize;
      }

      .sales-amount {
        float: right;
      }

      .g-tab {
        height: 99px;
        width: 190px;
        background-color: #ffffff;
      }

      .g-tab:hover:before {
        opacity: 0;
      }

      .g-tab:not(.g-tab__active) {
        height: 99px;
        width: 190px;
        background-color: #F9F9F9;
      }

      .tab-username {
        text-transform: uppercase;
        white-space: normal;
      }

      ::v-deep .g-tabs-wrapper {
        height: calc(100% - 64px);

        .g-tabs__vertical {
          .g-tabs-bar {
            overflow-y: auto;
            -ms-overflow-style: none;
          }

          /* Hide scrollbar for Chrome, Safari and Opera */
          .g-tabs-bar::-webkit-scrollbar {
            display: none;
          }
        }

        .g-tab-items {
          height: 100%;
          overflow-y: auto;

          .g-tab-item {
            padding: 40px 50px;
            background-color: #ffffff;
          }

        }
      }

    }
  }
</style>
