<template>
  <div style="position:relative;">
      <div class="report-column">
        <span>{{ $t('common.discount') }} ({{ $t('common.currency') }})</span>
        <span class="number">{{ $filters.formatCurrency(paymentDiscount) }}</span>
        <span>{{ $t('common.tax') }} ({{ $t('common.currency') }})</span>
        <span class="number">{{ $filters.formatCurrency(paymentTax) }}</span>
      </div>
      <div class="report-column">
        <span>{{ $t('common.subtotal') }} (€)</span>
        <span class="number">{{ $filters.formatCurrency(paymentSubTotal) }}</span>
        <span>{{ $t('common.total') }} (€)</span>
        <span class="number__important">{{ $filters.formatCurrency(paymentTotal) }}</span>
      </div>
  </div>
</template>

<script>
  export default {
    name: 'PosOrderScreenReport',
    injectService: ['OrderStore:(paymentTax,paymentTotal,paymentSubTotal,paymentDiscount)',]
  }
</script>

<style scoped lang="scss">
  .report {
    display: flex;
    padding: 0 8px 4px;

    &-column {
      flex: 1 1 0;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      grid-auto-rows: 1fr;
      grid-gap: 6px;
      padding: 8px 16px;
      background: #FAFAFA;
      border: 1px solid #979797;

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

    & > div:nth-child(1) {
      border-right: none;
      border-radius: 2px 0 0 2px;
    }

    & > div:nth-child(2) {
      border-radius: 0 2px 2px 0;
    }
  }

  @media screen and (max-height: 600px) {
    .report {
      &-column {
        font-size: 13px;
        padding: 4px 8px;
        grid-gap: 2px;

        .number__important {
          font-size: 16px;
        }
      }
    }
  }
</style>
