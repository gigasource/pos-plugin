<template>
  <div>
    <div class="two-head">
      <p>{{$t('payment.balanceDue')}}</p>
      <p>{{$t('payment.amountTendered')}}</p>
    </div>
    <div class="two-head">{{$t('payment.change')}}</div>
    <div class="input two-head">
      <p class="balance">€ {{ $filters.formatCurrency(paymentTotal) }}</p>
      <p class="amount">€ {{ $filters.formatCurrency(paymentAmountTendered || 0) }}</p>
    </div>
    <div class="input change">
      {{$t('common.currency')}} {{ $filters.formatCurrency(paymentChange) }}
    </div>
    <div>
      {{$t('payment.tip')}}
      <span class="tip">€ {{paymentTip}}</span>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'PosPaymentScreenBalance',
    injectService: [
      'OrderStore:paymentTotal',
      'OrderStore:paymentAmountTendered',
      'OrderStore:paymentTip',
      'OrderStore:paymentChange'
    ]
  }
</script>

<style scoped lang="scss">
  .screen {
    padding: 12px;
    line-height: 16px;
    font-size: 13px;
    font-weight: 700;

    .two-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .input {
      border: 1px solid #c9c9c9;
      background: #f0f0f0;
      border-radius: 4px;
      padding: 16px;

      .balance {
        font-size: 24px;
        color: #1271ff;
      }

      .amount {
        font-size: 20px;
      }

      &.change {
        display: flex;
        align-items: center;
        font-size: 20px;
      }
    }

    .tip {
      font-weight: 400;
    }
  }
</style>
