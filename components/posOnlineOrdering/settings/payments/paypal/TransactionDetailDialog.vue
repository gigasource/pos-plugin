<template>
  <g-dialog v-model="value" persistent>
    <div class="transaction-detail-dialog">
      <div class="transaction-detail-dialog__close-btn" @click="closeDialog">X</div>
      <div class="transaction-detail-dialog__title">Transaction Detail</div>
      <template v-if="transactionLoaded">
        <!-- Transaction basic info -->
        <template>
          <div>Transaction ID: {{transactionId}}</div>
          <div>Payer: <span style="font-weight: bold">{{payer.given_name}}</span> ({{payer.email}})</div>
        </template>
    
        <!-- Order details -->
        <template>
          <div class="hr-line"></div>
          <div style="font-weight: bold; font-size: 18px;">Order details:</div>
          <g-table class="order-detail">
            <tbody>
              <tr>
                <td v-for="(header, i) in headers" :key="i">{{header}}</td>
              </tr>
              <tr v-for="(item, i) in orders" :key="i">
                <td>{{item.name}}</td>
                <td>x{{item.quantity}}</td>
                <td>${{item.price}}</td>
                <td>${{item.total}}</td>
              </tr>
              <tr style="background-color: #EFEFEF">
                <td>Total</td>
                <td></td>
                <td></td>
                <td>${{ totalCartPrice }}</td>
              </tr>
            </tbody>
          </g-table>
        </template>
    
        <!-- Payment details -->
        <template>
          <div class="hr-line"></div>
          <div style="font-weight: bold; font-size: 18px;">Payment details:</div>
          <div class="row-flex align-items-center">
            <div>Purchase Total</div>
            <g-spacer/>
            <div>${{ totalCartPrice }}</div>
          </div>
          <div class="row-flex align-items-center">
            <div>Discount</div>
            <g-spacer/>
            <div>-${{discount}}</div>
          </div>
          
          <div class="hr-line hr-line--divider"></div>
          <div class="row-flex align-items-center">
            <div>Gross amount</div>
            <g-spacer/>
            <div>${{grossAmount}}</div>
          </div>
          <div class="row-flex align-items-center">
            <div>Transaction fee</div>
            <g-spacer/>
            <div>-${{transactionFee}}</div>
          </div>
          <div class="hr-line hr-line--divider"></div>
          <div class="row-flex align-items-center">
            <div>Net Amount</div>
            <g-spacer/>
            <div>${{ netAmount}}</div>
          </div>
        </template>
      </template>
      <template v-else>
        Loading...
      </template>
    </div>
  </g-dialog>
</template>
<script>
  import axios from 'axios';

  export default {
    name: 'PayPalTransactionDetailDialog',
    props: {
      value: Boolean,
      transactionId: String,
      startDate: String,
      endDate: String,
      store: Object,
    },
    data: function () {
      return {
        transactionLoaded: false,
        transaction: null,
        headers: ['Item', 'Q.ty', 'Price', 'Subtotal']
      }
    },
    computed: {
      payer() {
        return {
          given_name: this.transaction.payer_info.payer_name.given_name,
          email: this.transaction.payer_info.email_address
        }
      },
      totalCartPrice() {
        return _.sumBy(this.transaction.cart_info.item_details, itemDetail => parseFloat(itemDetail.total_item_amount.value))
      },
      orders() {
        return this.transaction.cart_info.item_details.map(itemDetail => ({
          name: itemDetail.item_name,
          quantity: parseInt(itemDetail.item_quantity),
          price: parseFloat(itemDetail.item_unit_price.value),
          total: parseFloat(itemDetail.total_item_amount.value),
          currency: itemDetail.item_unit_price.currency_code
        }))
      },
      discount() {
        return parseFloat(this.transaction.transaction_info.discount_amount.value)
      },
      grossAmount() {
        return parseFloat(this.transaction.transaction_info.transaction_amount.value)
      },
      transactionFee() {
        return Math.abs(parseFloat(this.transaction.transaction_info.fee_amount.value))
      },
      netAmount() {
        return (this.grossAmount - this.transactionFee).toFixed(2)
      }
    },
    async created() {
      this.transactionLoaded = false
      await this.loadTransaction()
      this.transactionLoaded = true
    },
    methods: {
      closeDialog() {
        this.$emit('input', false)
      },
      async loadTransaction() {
        const query = {
          start_date: this.startDate + '-0000',
          end_date: this.endDate + '-0000',
          transaction_id: this.transactionId,
          output: 'cart_info',
          store_id: this.store._id
        }
        const queryStr = _.keys(query).map(k => `${k}=${query[k]}`).join('&')
        const response = await axios.get(`/payment/paypal/transaction-detail?${queryStr}`)
        this.$set(this, 'transaction', response.data.transactions[0])
      }
    }
  }
</script>
<style scoped lang="scss">
  .transaction-detail-dialog {
    background-color: #FFF;
    border-radius: 5px;
    padding: 30px;
    min-width: 600px;
    min-height: 300px;
    margin: 0 auto;
    position: relative;
    
    &__close-btn {
      position: absolute;
      top: 16px;
      right: 25px;
      cursor: pointer;
    }
    
    &__title {
      font-weight: bold;
      font-size: 20px;
      margin-bottom: 20px;
    }
  }
  
  
  .hr-line {
    height: 1px;
    width: 100%;
    background-color: #9E9E9E;
    margin-top: 15px;
    margin-bottom: 15px;
    
    &--divider {
      margin: 0;
    }
  }
  
  .order-detail {
    td {
      height: 25px;
    }
    
    td:first-child {
      padding-left: 0;
    }
    
    td:last-child {
      padding-right: 0;
      text-align: right;
    }
  }
</style>
