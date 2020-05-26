<template>
  <div class="provider-transaction">
    <!-- Action bar -->
    <div class="row-flex align-items-center mb-4">
      <div class="provider-transaction__title">Transaction History</div>
      <g-spacer/>
      <div>
        <span class="text-grey-darken-1 fs-small mr-1">Total: </span>
        <span class="w-700 fs-large mr-3"> {{ loadingTransaction ? '...' : '$' + totalNetAmount }}</span>
      </div>
      <date-range-picker :from="startDate" :to="endDate" @save="changeDate"/>
    </div>
    
    <!-- Transaction table -->
    <div class="provider-transaction__table">
      <g-table elevation="2" fixed-header>
        <thead>
          <tr>
            <th v-for="header in headers">{{header}}</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="!loadingTransaction">
            <tr v-for="tran in transactionInfo" :key="tran.transactionId" @click="showTransactionDetailDialog(tran.transactionId)" style="cursor:pointer">
              <td>{{tran.date | fullDate}}</td>
              <td>{{tran.name}}</td>
              <td>${{tran.grossAmount}}</td>
              <td>${{tran.feeAmount}}</td>
              <td>${{tran.netAmount}}</td>
              <td>{{tran.type}}</td>
              <td>{{tran.paidBy}}</td>
            </tr>
          </template>
        </tbody>
      </g-table>
      <div v-if="loadingTransaction">
        Loading transaction info...
      </div>
    </div>
    
    <!-- Transaction detail dialog -->
    <transaction-detail-dialog
        v-if="dialog.transactionDetail.show"
        v-model="dialog.transactionDetail.show"
        :start-date="startDate"
        :end-date="endDate"
        :transaction-id="dialog.transactionDetail.transactionId"
        @close="hideTransactionDetailDialog"/>
  </div>
</template>
<script>
  import DateRangePicker from './dateRangePicker';
  import TransactionDetailDialog from './TransactionDetailDialog';
  import axios from 'axios';
  export default {
    name: 'PaymentProvidersTransaction',
    components: { TransactionDetailDialog, DateRangePicker },
    props: {
      store: Object,
    },
    filters: {
      fullDate(val) {
        return dayjs(val).format('YYYY-MM-DD HH:mm:ss')
      }
    },
    data: function () {
      const startDate = dayjs().format('YYYY-MM') + '-01T00:00:00'
      const endDate = dayjs().format('YYYY-MM-DD') + 'T23:59:59'
      
      return {
        loadingTransaction: false,
        transactions: [],
        selectedProvider: 'PayPal',
        providers: [
          { text: 'All', value: 'All' },
          { text: 'PayPal', value: 'PayPal' }
        ],
        startDate: startDate,
        endDate: endDate,
        month: dayjs().format('YYYY-MM'),
        headers: ['Date', 'Name', 'Gross', 'Fee', 'Net', 'Type', 'Paid by'],
        dialog: {
          transactionDetail: {
            show: false,
            transactionId: null,
          }
        }
      }
    },
    computed: {
      transactionInfo() {
        return _.map(this.transactions, tran => {
          const tranInfo = tran.transaction_info
          const payerInfo = tran.payer_info
          const fee = Math.abs(parseFloat(tranInfo.fee_amount.value))
          return {
            transactionId: tranInfo.transaction_id,
            date: tranInfo.transaction_initiation_date,
            name: `Payment from ${payerInfo.payer_name.given_name}`,
            grossAmount: parseFloat(tranInfo.transaction_amount.value),
            feeAmount: fee,
            netAmount:  parseFloat((parseFloat(tranInfo.transaction_amount.value) - fee).toFixed(2)),
            type: 'PayPal',
            paidBy: payerInfo.email_address
          }
        })
      },
      totalNetAmount() {
        if (this.transactionInfo)
          return _.sumBy(this.transactionInfo, tran => tran.netAmount)
      },
    },
    created() {
      this.listTransactions()
    },
    methods: {
      changeDate(val) {
        const dateFormatPattern = 'YYYY-MM-DDTHH:mm:ss'
        const fromDateDayJs = dayjs(val.fromDate)
        const toDateDayJs = dayjs(val.toDate)
        this.startDate = fromDateDayJs.format(dateFormatPattern)
        const dayDiffs = toDateDayJs.diff(fromDateDayJs, 'day')
        if (dayDiffs > 30) {
          alert('Date range maximum allowed is 30 days')
          this.endDate = fromDateDayJs.add(30, 'day').format(dateFormatPattern)
        } else {
          this.endDate = toDateDayJs.format(dateFormatPattern)
        }
        this.listTransactions()
      },
      showTransactionDetailDialog(tranId) {
        this.dialog.transactionDetail.show = true
        this.dialog.transactionDetail.transactionId = tranId
      },
      hideTransactionDetailDialog() {
        this.dialog.transactionDetail.show = false
        this.dialog.transactionDetail.transactionId = null
      },
      async listTransactions() {
        const query = {
          store_id: this.store._id,
          start_date: this.startDate + '-0700',
          end_date: this.endDate + '-0700',
        }
        this.loadingTransaction = true
        const queryStr = _.keys(query).map(k => `${k}=${query[k]}`).join('&')
        const response = await axios.get(`/payment/paypal/list-transaction?${queryStr}`)
        this.transactions.splice(0, this.transactions.length, ...response.data.transactions)
        this.loadingTransaction = false
      }
    }
  }
</script>
<style scoped lang="scss">
  .provider-transaction {
    &__title {
      font-family: Muli;
      font-style: normal;
      font-weight: bold;
      font-size: 18px;
      line-height: 23px;
    }
  
    &__table {
      height: calc(100% - 40px);
      width: 100%;
    
      .g-table {
        th, td {
          height: 40px;
          padding: 8px 4px 0;
          vertical-align: top;
          font-size: 14px;
          word-break: break-word;
        
          &:nth-child(1) {
            width: 20%;
          }
          
          &:nth-child(2) {
            width: 25%;
          }
          
          &:nth-child(3),
          &:nth-child(4),
          &:nth-child(5){
            width: 8%;
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
  }
</style>
