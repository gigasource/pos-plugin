<template>
  <div class="receipt">
    <g-toolbar color="#EFEFEF">
      <g-btn-bs width="120" icon="icon-back" class="elevation-2">
        Back
      </g-btn-bs>
      <g-btn-bs width="120" icon="icon-printer" class="elevation-2">
        Print
      </g-btn-bs>
      <g-btn-bs width="120" icon="icon-receipt2" style="white-space: unset" class="elevation-2">
        <div style="line-height: 0.9">
          <p>Company</p>
          <p>Receipt</p>
        </div>
      </g-btn-bs>
      <g-spacer/>
      <g-btn-bs width="120" background-color="#0EA76F" icon="icon-complete" class="elevation-2">
        Complete
      </g-btn-bs>
    </g-toolbar>
    <div class="receipt-main">
      <div class="receipt-main__header">
        <div class="receipt-main__header-title">{{store.name}}</div>
        <div class="receipt-main__header-subtitle">{{store.address}}</div>
        <div class="receipt-main__header-subtitle">
          <span class="mr-3">Tel: {{store.phone}}</span>
          <span>VAT Reg No: {{store.vat}}</span>
        </div>
      </div>
      <div class="receipt-main__title">Table: {{order.table}}</div>
      <div class="receipt-main__item" v-for="(seat, i) in order.seats" :key="i">
        <div class="row-flex align-items-center">
          <g-menu v-model="menu[i]" open-on-hover nudge-bottom="10" content-class="menu-receipt-action">
            <template v-slot:activator="{ on }">
              <div v-on="on" :class="['receipt-main__item-seat', menu[i] && 'receipt-main__item-seat--selected']">Seat {{seat.no}}</div>
            </template>
            <div class="row-flex pa-2 bg-white align-items-start">
              <g-btn-bs icon="icon-printer" class="elevation-2">
                Print
              </g-btn-bs>
              <g-btn-bs class="elevation-2">
                Bewirtung
              </g-btn-bs>
              <div>
                <g-btn-bs width="90" block icon="icon-credit_card" :background-color="getPaymentColor(seat.payment, 'card')" class="elevation-2">
                  Card
                </g-btn-bs>
                <g-btn-bs width="90" block icon="icon-cash" :background-color="getPaymentColor(seat.payment, 'cash')" class="elevation-2 my-2">
                  Cash
                </g-btn-bs>
                <g-btn-bs width="90" block icon="icon-multi_payment" :background-color="getPaymentColor(seat.payment, 'multi')" @click="openMultiDialog(seat)" class="elevation-2">
                  Multi
                </g-btn-bs>
              </div>
              <g-btn-bs width="90" block icon="icon-email" class="elevation-2">
                Email
              </g-btn-bs>
              <g-btn-bs block icon="icon-coin-box" class="elevation-2">
                Trinkgeld
              </g-btn-bs>
            </div>
          </g-menu>
          <g-spacer/>
          <div class="receipt-main__item-total" v-for="(p, iP) in seat.payment" :key="`payment_${i}_${iP}`">
            <g-icon class="mr-1">{{getIcon(p.type)}}</g-icon>
            <span>${{p.value}}</span>
          </div>
        </div>
        <div class="receipt-main__item-header">
          <div class="col-1">Q.ty</div>
          <div class="col-9">Item name</div>
          <div class="col-2 ta-right">Total</div>
        </div>
        <div class="receipt-main__item-row" v-for="(item, j) in seat.items" :key="`item_${i}_${j}`">
          <div class="col-1">{{item.quantity}}</div>
          <div class="col-9">{{item.name}}</div>
          <div class="col-2 ta-right">{{(item.price * item.quantity) | formatMoney}}</div>
        </div>
      </div>
    </div>
    <dialog-multi-payment rotate v-model="dialog.multi"/>
  </div>
</template>

<script>
  export default {
    name: "PosOrderReceipt",
    props: {},
    filters: {
      formatMoney(value) {
        return !isNaN(value) ? value.toFixed(2) : value
      }
    },
    data() {
      return {
        store: {
          name: 'Lotteria Nguyen Khanh Toan',
          address: '103 DN11, Nguyen Khanh Toan, Quan Hoa, Cau Giay, Ha Noi',
          phone: '0462.813.977',
          vat: '123456789'
        },
        order: {
          table: 5,
          seats: [
            {
              no: '1',
              payment: [{
                type: 'cash',
                value: 196.62
              }],
              items: [
                {name: 'Vodka', quantity: 1, price: 10.00},
                {name: 'Peperoni pizza', quantity: 1, price: 10.00},
                {name: 'Weed', quantity: 1, price: 10.00},
                {name: 'Coca cola', quantity: 1, price: 10.00},
                {name: 'Marlboro', quantity: 1, price: 10.00},
              ]
            },
            {
              no: '2',
              payment: [{
                type: 'card',
                value: 196.62
              }],
              items: [
                {name: 'Vodka', quantity: 1, price: 10.00},
                {name: 'Peperoni pizza', quantity: 1, price: 10.00},
                {name: 'Weed', quantity: 1, price: 10.00},
                {name: 'Coca cola', quantity: 1, price: 10.00},
                {name: 'Marlboro', quantity: 1, price: 10.00},
              ]
            },
          ]
        },
        menu: [],
        dialog: {
          multi: false,
        },
        tempSeat: null
      }
    },
    created() {
      this.menu = this.order.seats.map(() => false)
    },
    methods: {
      getIcon(type) {
        if(type === 'card') return 'icon-credit_card'
        return 'icon-cash'
      },
      getPaymentColor(payment, type) {
        if((payment.length > 1 && type === 'mutli') || (payment.length === 1 && type === payment[0].type))
          return '#1271ff'
        return 'white'
      },
      openMultiDialog(seat) {
        this.tempSeat = seat
        this.dialog.multi = true
      },
    }
  }
</script>

<style scoped lang="scss">
  .receipt {
    transform: rotate(-90deg);
    transform-origin: left top;
    width: 100vh;
    position: absolute;
    top: 100%;
    left: 0;

    &-main {
      padding: 32px;
      background-color: white;

      &__header {
        margin-bottom: 32px;
        text-align: center;

        &-title {
          font-size: 20px;
          font-weight: 700;
        }

        &-subtitle {
          font-size: 12px;
          line-height: 14px;
        }
      }

      &__title {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 16px;
      }

      &__item {
        margin-bottom: 36px;

        &-seat {
          width: 100px;
          height: 36px;
          line-height: 36px;
          font-weight: 700;
          background: #FFFFFF;
          border: 1px solid #D0D0D0;
          border-radius: 2px;
          text-align: center;

          &--selected {
            border-color: #1271FF;
            background: #E3F2FD;
          }
        }

        &-total {
          font-weight: 700;
          margin-left: 4px;
          padding: 0 4px;

          & + .receipt-main__item-total {
            border-left: 1px solid black;
          }
        }

        &-header {
          display: flex;
          align-items: center;
          border-top: 1px dashed black;
          border-bottom: 1px dashed black;
          margin: 12px 0 4px;
          padding: 4px 0;
          font-weight: 700;
        }

        &-row {
          display: flex;
          align-items: center;
          padding: 4px 0;
        }
      }
    }
  }

  .g-btn-bs {
    font-size: 14px;
    background-color: white;
  }
</style>

<style lang="scss">
  .menu-receipt-action {
    transform: rotate(-90deg) translateX(calc(-100% + 16px)) translateY(40px);
    transform-origin: left top;
  }
</style>
