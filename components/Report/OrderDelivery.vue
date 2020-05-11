<template>
  <div class="kitchen-report-main-container">
    <div class="header" :style="wrapperStyle" v-if="deliveryTime">
      <div style="font-size: 40px; margin-bottom: 20px">
        <span>{{orderType}} #{{orderNumber}}</span>
        <span style="float: right">{{deliveryTime}}</span>
      </div>
      <div v-if="customerCompany" style="font-size: 40px; margin-bottom: 20px">
        <span style="background-color: black; color: white">{{locale.printing.company}}</span>
      </div>
    </div>
    <div class="header" :style="wrapperStyle" v-else>
      <div style="text-align: center; font-size: 40px; margin-bottom: 20px">{{locale.printing.delivery}} #{{orderNumber}}</div>
      <div v-if="customerCompany" style="text-align: center; font-size: 40px; margin-bottom: 20px">
        <span style="background-color: black; color: white">{{locale.printing.company}}</span>
      </div>
    </div>

    <br v-if="deliveryTime"/>

    <div class="info">
      <div>{{customerName}}</div>
      <div v-if="customerCompany">{{customerCompany}}</div>
      <div v-if="customerAddress">{{customerAddress}}</div>
      <div v-if="customerZipCode">{{customerZipCode}}</div>
      <div>{{customerPhone}}</div>
      <div v-if="note">{{note}}</div>
    </div>
    <div class="divider-dashed"/>
    <div class="kitchen-items">
      <table>
        <thead>
        <tr style="font-weight: bold">
          <th width="42%" style="text-align: left; padding-left: 12px">{{locale.printing.item}}</th>
          <th width="5%" style="text-align: right">{{locale.printing.quantity}}</th>
          <th width="18%" style="text-align: right">{{locale.printing.price}}</th>
          <th width="25%" style="text-align: right; padding-right: 2px;">{{locale.printing.total}}</th>
        </tr>
        </thead>
        <tr v-for="item in items">
          <td width="42%" style="padding-left: 12px">{{item.id}}. {{item.name}}</td>
          <td width="5%" style="text-align: right">{{item.quantity}}</td>
          <td width="18%" style="text-align: right">{{item.price | convertMoney}}</td>
          <td width="25%" style="text-align: right; padding-right: 2px;">{{(item.price * item.quantity) | convertMoney}}</td>
        </tr>
      </table>
    </div>
    <div class="divider-dashed"/>
    <div class="bold" style="font-size: 30px; margin-top: 20px">
      <span>{{locale.printing.total}}</span>
      <span class="float-right">{{locale.printing.currency}} {{orderSum | convertMoney}}</span>
    </div>
<!--    <div class="footer text-center">{{date}}</div>-->
  </div>
</template>

<script>
  export default {
    name: 'OrderDelivery',
    props: {
      items: Array,
      date: String,
      fontSize: Number,
      marginTop: Number,
      orderNumber: [String, Number],
      customerName: String,
      customerCompany: String,
      customerPhone: String,
      customerAddress: String,
      customerZipCode: String,
      note: String,
      orderSum: Number,
      deliveryTime: String,
      locale: Object,
      type: String
    },
    filters: {
      convertMoney(value) {
        return !isNaN(value) ? value.toFixed(2) : value
      }
    },
    computed: {
      wrapperStyle() {
        return { marginTop: `${Math.floor((this.marginTop || 0) * 71)}px` }
      },
      computedFontSize() {
        if (this.fontSize === 1) {
          return `${(this.fontSize - 1) * 5 + 40}px`
        }
        if (this.fontSize === 2) {
          return `${(this.fontSize - 1) * 5 + 50}px`
        }
        if (this.fontSize === 3) {
          return `${(this.fontSize - 1) * 5 + 60}px`;
        }
        return '40px'
      },
      orderType() {
        return this.type === 'delivery'
          ? this.locale.printing.delivery
          : this.locale.printing.pickup
      }
    }
  }
</script>

<style lang="scss">
  .kitchen-report-main-container {
    width: 100%;
    padding: 0;
    background-color: #ffffff;
    font-family: Verdana, sans-serif;
    font-style: normal;
    box-sizing: border-box;

    p {
      margin: 0;
    }

    .bold {
      font-weight: bold;
    }

    .text-center {
      text-align: center;
    }

    .text-end {
      text-align: end;
    }

    .float-right {
      float: right;
    }

    .divider {
      font-size: 25px;
      border-width: 1px;
      margin: 30px 0;
      align-self: center;
      width: 100%;

      &-dashed {
        border-style: dashed;
      }
    }

    .header {
      margin-bottom: 20px;

      &-table {
        font-size: 35px;
      }
    }

    .info {
      font-size: 25px;
      margin-bottom: 20px;
    }

    .inset {
      padding-left: 80px;
    }

    .kitchen-items {
      margin-top: 20px;
      margin-bottom: 20px;
      font-size: 25px;
    }

    .footer {
      margin-top: 20px;
      font-size: 25px;
    }
  }
</style>
