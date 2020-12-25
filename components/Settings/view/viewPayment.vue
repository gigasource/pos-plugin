<template>
  <div>
    <div>
      <g-simple-table striped>
        <tr>
          <th>{{$t('settings.paymentName')}}</th>
          <th>{{$t('settings.paymentIcon')}}</th>
        </tr>
        <tr v-for="payment in listPayments" @click="select(payment)"
            :class="[selectedPayment && selectedPayment._id === payment._id && 'bordered']">
          <td style="text-transform: capitalize">{{payment.name}}</td>
          <td>
            <img class="payment-icon" :src="payment.icon"/>
          </td>
        </tr>
      </g-simple-table>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'viewPayment',
    injectService: [
      'SettingsStore:listPayments',
      'SettingsStore:getListPayments',
      'SettingsStore:selectedPayment',
    ],
    data() {
      return {
        listPayments: [],
        selectedPayment: null
      }
    },
    async created() {
      await this.getListPayments();
    },
    methods: {
      select(payment) {
        this.selectedPayment = payment
      },
      getListPayments() {}
    },
    beforeUnmount() {
      this.selectedPayment = null;
    }
  }
</script>

<style scoped lang="scss">
  .g-table {
    tr th {
      color: #1d1d26;
      text-align: left;
    }

    th:first-child, td:first-child {
      width: 200px;
    }

    td {
      height: 32px
    }

    .payment-icon {
      width: 20px;
      height: 20px;
    }

    .bordered {
			box-shadow: 0 0 4px rgba(18, 113, 255, 0.563019);

      td {
        border-top: 2px solid #1271ff;
        border-bottom: 2px solid #1271ff;
      }

			td:first-child {
				border-left: 2px solid #1271ff;
			}

			td:last-child {
				border-right: 2px solid #1271ff;
			}
    }
  }
</style>
