<template>
  <div>
    <slot :close="close" :open="open" name="activator"></slot>
    <g-dialog eager overlay-color="#6B6F82" overlay-opacity="0.95" v-model="dialog" width="70%">
      <div style="width: 100%; background-color: #fff; position: relative; height: 75vh">
        <p class="eod-header">{{ $t('report.xReport') }}</p>
        <div style="height: calc(100% - 145px); overflow-y: auto;">
          <div class="eod-dialog-main">
            <div class="eod-dialog-content" v-if="xReport">
              <p class="section-title eod-title">{{ $t('common.sales') }}</p>
              <div class="eod-details">
                <div class="details-content" v-for="(paymentValue, paymentName) in xReport.sumByPayment">
                  <p>{{ paymentName }}</p>
                  <p>€ {{ $filters.formatCurrency(paymentValue) }}</p>
                </div>
                <div class="total-content">
                  <p class="eod-subtitle">{{ $t('common.total') }}</p>
                  <p style="text-decoration: underline; font-weight: 800;">€
                    {{ $filters.formatCurrency(getSum(xReport.sumByPayment)) }}</p>
                </div>
              </div>

              <p class="section-title eod-title">{{ $t('report.productSold') }}</p>
              <div class="eod-details">
                <div v-for="(items, category) in xReport.groupItemsByCategory">
                  <p class="eod-subtitle">{{ category || 'No category' }}
                    (€{{ $filters.formatCurrency(xReport.sumByCategory[category]) }})</p>
                  <div class="eod-sales-detail">
                    <p v-for="(quantity, name) in items">{{ quantity }} x {{ name }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <g-toolbar bottom color="#eee">
            <g-spacer/>
            <g-btn :uppercase="false" @click="close" class="mr-2">
              {{ $t('ui.cancel') }}
            </g-btn>
            <g-btn :uppercase="false" background-color="#2979FF" text-color="#fff" @click.stop="print">
              <g-icon class="mr-2" svg>icon-print</g-icon>
              {{ $t('ui.print') }}
            </g-btn>
          </g-toolbar>
        </div>
      </div>
    </g-dialog>
  </div>

</template>

<script>
  import { getInternalValue } from 'pos-vue-framework';

  export default {
    name: 'PosEndOfDayPrintDialog',
    injectService: ['ReportsStore:(getXReport,printXReport)'],
    data() {
      return {
        xReport: null,
        date: null
      }
    },
    props: {
      value: null,
    },
    methods: {
      async open(date) {
        this.dialog = true;
        this.date = date;
        this.xReport = this.getXReport(date)
      },
      close() {
        this.dialog = false
        this.xReport = null
      },
      getSum(paymentTypes) {
        return _.reduce(paymentTypes, (res, value) => res + value, 0)
      },
      async print() {
        await this.printXReport(this.date)
      },
      getXReport() {
        console.error('ReportsStore:getXReport was not injected')
      },
      printXReport() {
        console.error('ReportsStore:printXReport was not injected')
      }
    },
    setup() {
      const dialog = getInternalValue(...arguments);
      return { dialog };
    },
  }
</script>

<style lang="scss" scoped>
  .eod-dialog-close {
    position: absolute;
    right: 10px;
    top: 10px;
  }

  .eod-dialog-main {
    height: 100%;
    margin-top: 25px;

    .eod-dialog-content {
      padding: 0 60px 20px 60px;

      .eod-title {
        font-style: normal;
        font-weight: bold;
        font-size: 16px;
        height: 30px;
        line-height: 20px;
        color: #1D1D26;
      }

      .eod-subtitle {
        font-size: 14px;
        font-style: normal;
        font-weight: bold;
        line-height: 30px;
        color: #1D1D26;
      }

      .section-title {
        border-bottom: 1px dashed #000000;
      }

      .eod-details:first-child {
        background-image: linear-gradient(to right, #333 40%, rgba(255, 255, 255, 0) 20%);
        background-position: top;
        background-size: 6px 1px;
        background-repeat: repeat-x;
      }

      .eod-details {
        .details-content {
          text-transform: capitalize;
          display: flex;
          height: 30px;
          justify-content: space-between;
          align-items: center;
          font-style: normal;
          font-weight: normal;
          font-size: 14px;
          line-height: 25px;
          margin: 0 0 0 16px;
        }

        .eod-sales-detail {
          font-style: normal;
          font-weight: normal;
          font-size: 14px;
          line-height: 30px;
          color: #1D1D26;

          p {
            margin-left: 16px;
          }
        }

        .total-content {
          display: flex;
          height: 30px;
          justify-content: space-between;
          align-items: center;
          margin: 10px 0 30px 0;

        }
      }
    }
  }

  .eod-header {
    margin-top: 50px;
    text-align: center;
    font-style: normal;
    font-weight: bold;
    font-size: 20px;
    line-height: 25px;
    color: #1D1D26;
  }
</style>
