<template>
  <div class="provider-transaction">
    <!-- Transaction table -->
    <div class="provider-transaction__table" style="box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);">
      <g-table elevation="0" fixed-header>
        <thead>
        <tr>
          <th v-for="header in headers">{{header}}</th>
        </tr>
        </thead>
        <tbody>
        <template v-if="!loadingTransaction">
          <tr v-for="tran in transactionInfoPage" :key="tran.transactionId" @click="showTransactionDetailDialog(tran.transactionId)" style="cursor:pointer">
            <td>{{tran.date | fullDate}}</td>
            <td>{{tran.name}}</td>
            <td>{{tran.currencyCode}}{{tran.grossAmount}}</td>
            <td>{{tran.currencyCode}}{{tran.feeAmount}}</td>
            <td>{{tran.currencyCode}}{{tran.netAmount}}</td>
            <td>{{tran.type}}</td>
            <td>{{tran.paidBy}}</td>
          </tr>
        </template>
        </tbody>
      </g-table>
      <div v-if="!loadingTransaction" class="row-flex justify-end" style="background-color: #efefef;">
        <div v-for="pageEntry in pageEntries"
             :key="pageEntry" @click="moveToPage(pageEntry)"
             style="padding: 5px 10px; margin: 5px; border-radius: 4px; background-color: #DDD; cursor:pointer;">
          {{pageEntry}}
        </div>
      </div>
      <div v-else>
        Loading transaction info...
      </div>
    </div>
  
    <!-- notice -->
    <div style="font-style: italic; font-size: small;margin-top: 10px">
      <div>(*) Last update: {{lastRefreshedDateTime}}</div>
      <div>(*) It takes a maximum of three hours for executed transactions to appear in the list transactions call.</div>
    </div>
  
    <!-- Transaction detail dialog -->
    <transaction-detail-dialog
        v-if="dialog.transactionDetail.show"
        v-model="dialog.transactionDetail.show"
        :start-date="startDate"
        :end-date="endDate"
        :store="store"
        :transaction-id="dialog.transactionDetail.transactionId"
        @close="hideTransactionDetailDialog"/>
  </div>
</template>
<script>
  import TransactionDetailDialog from './TransactionDetailDialog';
  import { currencyCodeToSymbol } from '../../../../Store/currencyHelper';
  import axios from 'axios';
  
  export default {
    name: 'PayPalTransactions',
    components: {TransactionDetailDialog},
    props: {
      store: Object,
      startDate: String,
      endDate: String,
    },
    filters: {
      fullDate(val) {
        return dayjs(val).format('YYYY-MM-DD HH:mm:ss')
      }
    },
    data: function () {
      return {
        loadingTransaction: false,
        transactions: [],
        lastRefreshedDateTime: null,
        month: dayjs().format('YYYY-MM'),
        headers: ['Date', 'Name', 'Gross', 'Fee', 'Net', 'Type', 'Paid by'],
        pagination: {
          index: 1,
          current: 1,
          total: 1,
          itemsPerPage: 30
        },
        dialog: {
          transactionDetail: {
            show: false,
            transactionId: null,
          }
        }
      }
    },
    created() {
      this.listTransactions()
    },
    computed: {
      transactionInfo() {
        return _.map(this.transactions, tran => {
          const tranInfo = tran.transaction_info
          const payerInfo = tran.payer_info
          const feeAmount = (tranInfo.fee_amount && tranInfo.fee_amount.value) || "0"
          const fee = Math.abs(parseFloat(feeAmount))
          return {
            transactionId: tranInfo.transaction_id,
            date: tranInfo.transaction_initiation_date,
            name: `Payment from ${payerInfo.payer_name.given_name}`,
            grossAmount: parseFloat(tranInfo.transaction_amount.value),
            feeAmount: fee,
            netAmount:  parseFloat((parseFloat(tranInfo.transaction_amount.value) - fee).toFixed(2)),
            type: 'PayPal',
            paidBy: payerInfo.email_address,
            // WARNING:::::::: EXPECT THAT GROSS, NET, FEE AMOUNT HAVE THE SAME CURRENCY UNIT :::::
            currencyCode: currencyCodeToSymbol(tranInfo.transaction_amount.currency_code)
          }
        })
      },
      transactionInfoPage() {
        let start = (this.pagination.current - 1) * this.pagination.itemsPerPage
        if (start > this.transactionInfo.length)
          return []

        let end = start + this.pagination.itemsPerPage
        if (end > this.transactionInfo.length)
          end = this.transactionInfo.length

        let pageItems = []
        for (let i = start; i< end; ++i) {
          pageItems.push(this.transactionInfo[i])
        }
        return pageItems
      },
      pageEntries() {
        const entries = []
        for(let i=1; i<=this.pagination.total; ++i) {
          entries.push(i)
        }
        return entries
      }
    },
    methods: {
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
          start_date: this.startDate + '-0000',
          end_date: this.endDate + '-0000',
        }
        this.loadingTransaction = true
        const queryStr = _.keys(query).map(k => `${k}=${query[k]}`).join('&')
        const response = await axios.get(`/payment/paypal/list-transaction?${queryStr}`)
        this.transactions.splice(0, this.transactions.length, ...response.data.transactions)
        this.pagination.total = Math.floor(response.data.transactions.length / this.pagination.itemsPerPage) + (response.data.transactions.length % this.pagination.itemsPerPage === 0 ? 0 : 1)
        this.lastRefreshedDateTime = dayjs(response.data.lastRefreshedDateTime).format('YYYY-MM-DD HH:mm:ss [GMT]Z')
        this.loadingTransaction = false
      },
      moveToPage(index) {
        this.pagination.current = index
      },
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
