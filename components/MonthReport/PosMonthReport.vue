<template>
  <div class="report-wrapper">
    <div class="report-content">
      <div class="report__sales">
        <div class="title">Sales</div>
        <g-divider dashed color="black"/>
        <div class="detail" v-for="(amount, payment) in salesByPayment" :key="`sales${payment}`">
          <span>{{ payment }}</span>
          <span>€ {{ $filters.formatCurrency(amount) }}</span>
        </div>
        <div class="total">
          <span>{{ $t('common.total') }}</span>
          <span><u>€ {{ $filters.formatCurrency(total) }}</u></span>
        </div>
      </div>
      <div v-show="showAllZNumber" class="report__z-number">
        <g-divider dashed color="black"/>
        <table>
          <tr v-for="(z, i) in zNumbers" :key="`zNumber${i}`" class="z-number">
            <td>
              <div class="row-flex justify-between">
                <span>{{ $t('report.zNumber') }} {{ z.z }}:</span>
                <span class="ml-2">€ {{ $filters.formatCurrency(z.sum) }}</span>
              </div>
            </td>
            <td class="pl-3">{{ $t('common.date') }}: {{ z.date }}</td>
          </tr>
        </table>
        <g-divider dashed color="black"/>
      </div>
      <div v-if="showProductSold" class="report__product">
        <div class="title">{{ $t('report.productSold') }}</div>
        <g-divider dashed color="black"/>
        <div v-for="({products, sum}, category) in salesByCategory" :key="`category${category}`">
          <p class="category">
            {{ category || 'No category' }} (€ {{ $filters.formatCurrency(sum) }})
          </p>
          <p class="product" v-for="{product, quantity} in products" :key="`item${product}`">
            {{ quantity }} x {{ product }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'PosMonthReport',
    injectService: ['ReportsStore:(monthReport,getMonthReport,showAllZNumber,showProductSold)'],
    data() {
      return {
        total: 0,
        salesByCategory: null,
        salesByPayment: null,
        zNumbers: null,
      }
    },
    async created() {
      const reportsStore = this.$getService('ReportsStore')
      this.unwatch = reportsStore.$watch('monthReport', newVal => {
        if (newVal) {
          const { total, salesByCategory, salesByPayment, zNumbers } = newVal
          this.total = total
          this.salesByCategory = salesByCategory
          this.salesByPayment = salesByPayment
          this.zNumbers = zNumbers
        }
      })

      await reportsStore.getMonthReport()
    },
    async activated() {
      await this.getMonthReport()
    },
    beforeDestroy() {
      this.unwatch()
    }
  }
</script>

<style scoped lang="scss">
  .report-wrapper {
    background: #d8d8d8;
    padding: 0 15%;
    z-index: -1;

    .report-content {
      background: white;
      padding: 32px;
      color: #1d1d26;
      overflow: auto;
      height: 100%;

      .title {
        font-weight: 700;
        font-size: 16px;
        line-height: 20px;
        margin-bottom: 12px;
        margin-top: 8px;
      }

      .report__sales {

        .detail {
          display: flex;
          justify-content: space-between;
          padding-left: 16px;
          padding-top: 8px;
          font-size: 14px;
          line-height: 25px;
          text-transform: capitalize;
        }

        .total {
          display: flex;
          justify-content: space-between;
          font-weight: 800;
          font-size: 14px;
          line-height: 30px;
          padding: 12px 0;
        }
      }

      .report__z-number {
        margin: 16px 0 32px;

        .z-number {
          font-size: 14px;
          line-height: 25px;

          + .g-divider {
            margin-top: 16px;
          }
        }

        .g-divider + .z-number {
          margin-top: 16px;
        }
      }

      .report__product {
        .category {
          font-weight: 800;
          font-size: 14px;
          line-height: 30px;
          padding-top: 8px;
        }

        .product {
          padding: 0 16px;
          font-size: 14px;
          line-height: 25px;
        }
      }
    }
  }
</style>
