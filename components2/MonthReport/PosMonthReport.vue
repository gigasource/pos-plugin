<script>
import {$filters} from '../AppSharedStates';
import {onActivated, ref, watch} from 'vue'
import {getMonthReport, monthReport, showProductSold} from "./month-report-shared";
import {useI18n} from "vue-i18n";
import _ from 'lodash';
import { genScopeId } from '../utils';

export default {
  name: 'PosMonthReport',
  setup() {
    const {t} = useI18n();

    getMonthReport();

    onActivated(getMonthReport);

    return genScopeId(() => (
        <div class="report-wrapper">
          <div class="report-content">
            <div class="report__sales">
              <div class="title">
                Sales
              </div>
              <g-divider dashed color="black">
              </g-divider>
              {monthReport.value && _.map(monthReport.value.salesByPayment, (amount, payment) =>
                  <div class="detail" key={`sales${payment}`}>
                    <span> {payment} </span>
                    <span>€{$filters.formatCurrency(amount)} </span>
                  </div>
              )}
              {monthReport.value && <div class="total">
                <span>
                  {t('common.total')} </span>
                <span>
                  <u>
                    € {$filters.formatCurrency(monthReport.value.total)} </u>
                </span>
              </div>}
            </div>
            <div class="report__z-number">
              <g-divider dashed color="black"/>
              <table>
                {monthReport.value && _.map(monthReport.value.zNumbers, (report, i) =>
                    <tr key={`zNumber${i}`} class="z-number">
                      <td>
                        <div class="row-flex justify-between">
                          <span>
                            {t('report.zNumber')} {report.z}: </span>
                          <span class="ml-2">
                            € {$filters.formatCurrency(report.sum)} </span>
                        </div>
                      </td>
                      <td class="pl-3">
                        {t('common.date')}: {report.date} </td>
                    </tr>
                )} </table>
              <g-divider dashed color="black"/>
            </div>
            {showProductSold.value &&
            <div class="report__product">
              <div class="title">{t('report.productSold')} </div>
              <g-divider dashed color="black"/>
              {monthReport.value && _.map(monthReport.value.salesByCategoryName, (category, categoryName) =>
                  <div key={`category${categoryName}`}>
                    <p class="category">
                      {categoryName || 'No category'} (€ {$filters.formatCurrency(monthReport.value.salesByCategory[categoryName].vSum)})
                    </p>
                    {_.map(category, ({vSum, quantity}, product) =>
                        <p class="product" key={`item${product}`}>
                          {quantity} x {product} (€ {$filters.formatCurrency(vSum)})
                        </p>
                    )}
                  </div>
              )}
            </div>}
          </div>
        </div>
    ))
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
