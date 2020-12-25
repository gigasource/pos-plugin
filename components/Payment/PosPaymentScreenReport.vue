<template>
  <div>
    <div class="report-column">
      <span>{{ $t('common.discount') }} ({{ $t('common.currency') }})</span>
      <span class="number">{{ $filters.formatCurrency(paymentDiscount) }}</span>
      <span>{{ $t('common.tax') }} ({{ $t('common.currency') }})</span>
      <span class="number">{{ $filters.formatCurrency(paymentTax) }}</span>
    </div>
    <g-divider inset vertical color="#979797"/>
    <div class="report-column">
      <span>{{ $t('common.subtotal') }} ({{ $t('common.currency') }})</span>
      <span class="number">{{ $filters.formatCurrency(paymentSubTotal) }}</span>
      <span>{{ $t('common.total') }} ({{ $t('common.currency') }})</span>
      <span class="number__important">{{ $filters.formatCurrency(paymentTotal) }}</span>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'PosPaymentScreenReport',
    injectService: [
      'OrderStore:paymentDiscount',
      'OrderStore:paymentTax',
      'OrderStore:paymentSubTotal',
      'OrderStore:paymentTotal',
    ]
  }
</script>

<style scoped lang="scss">
  .report {
    display: flex;

    &-column {
      flex: 1 1 0;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-auto-rows: 1fr;
      grid-gap: 6px;
      padding: 8px 16px;

      .number {
        text-align: right;

        &__important {
          text-align: right;
          font-size: 20px;
          font-weight: 700;
          color: #1271ff;
        }
      }
    }
  }

</style>
