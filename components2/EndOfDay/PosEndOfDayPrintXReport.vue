<script>

import {$filters} from '../AppSharedStates';
import {ref, watchEffect, withModifiers} from 'vue'
import {genScopeId, internalValueFactory} from "../utils";
import {useI18n} from "vue-i18n";
import {getXReport, printXReport, xReport} from "./eod-shared";
import _ from 'lodash';

export default {
  name: 'PosEndOfDayPrintXReport',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, {emit, slots}) {
    const {t} = useI18n();

    const dialog = internalValueFactory(props, {emit})

    watchEffect(async () => dialog.value && await getXReport())

    const close = function () {
      dialog.value = false
      xReport.value = null
    }

    const getSum = function (paymentTypes) {
      return _.reduce(paymentTypes, (res, values) => res + values, 0)
    }
    const open = () => dialog.value = true;

    return genScopeId(() => (
        <div>
          {slots.activator && slots.activator({close, open})}
          <g-dialog eager overlay-color="#6B6F82" overlay-opacity="0.95" v-model={dialog.value} width="70%">
            {genScopeId(() => <>
              <div style="width: 100%; background-color: #fff; position: relative; height: 75vh">
                <p class="eod-header">{t('report.xReport')} </p>
                <div style="height: calc(100% - 145px); overflow-y: auto;">
                  <div class="eod-dialog-main">
                    {(xReport.value) &&
                    <div class="eod-dialog-content">
                      <p class="section-title eod-title">
                        {t('common.sales')} </p>
                      <div class="eod-details">
                        {_.map(xReport.value.sumByPayment, (paymentValue, paymentName) =>
                            <div class="details-content">
                              <p>
                                {paymentName} </p>
                              <p>
                                € {$filters.formatCurrency(paymentValue)} </p>
                            </div>
                        )}
                        <div class="total-content">
                          <p class="eod-subtitle">
                            {t('common.total')} </p>
                          <p style="text-decoration: underline; font-weight: 800;">
                            €{$filters.formatCurrency(getSum(xReport.value.sumByPayment))}
                          </p>
                        </div>
                      </div>
                      <p class="section-title eod-title">
                        {t('report.productSold')} </p>
                      <div class="eod-details">
                        {_.map(xReport.value.groupItemsByCategory, (items, category) =>
                            <div>
                              <p class="eod-subtitle">
                                {category || 'No category'}
                                (€{$filters.formatCurrency(xReport.value.sumByCategory[category])})
                              </p>
                              <div class="eod-sales-detail">
                                {_.map(items, ({vSum, quantity}, name) =>
                                    <p> {quantity} x {name} ({vSum}) </p>
                                )}
                              </div>
                            </div>
                        )} </div>
                    </div>
                    }
                  </div>
                  <g-toolbar bottom color="#eee">
                    <g-spacer>
                    </g-spacer>
                    <g-btn uppercase={false} onClick={close} class="mr-2">

                      {t('ui.cancel')}
                    </g-btn>
                    <g-btn uppercase={false} background-color="#2979FF" text-color="#fff"
                           onClick={printXReport}>
                      <g-icon class="mr-2" svg>
                        icon-print
                      </g-icon>
                      {t('ui.print')}
                    </g-btn>
                  </g-toolbar>
                </div>
              </div>
            </>)()}
          </g-dialog>
        </div>
    ))
  }
}
</script>

<style lang="scss" scoped>
.eod-dialog-close {
  position: absolute;
  right: 10px;
  top: 10px;
}

.eod-dialog-main {
  height: 100%;
  margin-top: 25px;

  .eod-dialog-content {
    padding: 0 60px 20px 60px;

    .eod-title {
      font-style: normal;
      font-weight: bold;
      font-size: 16px;
      height: 30px;
      line-height: 20px;
      color: #1D1D26;
    }

    .eod-subtitle {
      font-size: 14px;
      font-style: normal;
      font-weight: bold;
      line-height: 30px;
      color: #1D1D26;
    }

    .section-title {
      border-bottom: 1px dashed #000000;
    }

    .eod-details:first-child {
      background-image: linear-gradient(to right, #333 40%, rgba(255, 255, 255, 0) 20%);
      background-position: top;
      background-size: 6px 1px;
      background-repeat: repeat-x;
    }

    .eod-details {
      .details-content {
        text-transform: capitalize;
        display: flex;
        height: 30px;
        justify-content: space-between;
        align-items: center;
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        line-height: 25px;
        margin: 0 0 0 16px;
      }

      .eod-sales-detail {
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        line-height: 30px;
        color: #1D1D26;

        p {
          margin-left: 16px;
        }
      }

      .total-content {
        display: flex;
        height: 30px;
        justify-content: space-between;
        align-items: center;
        margin: 10px 0 30px 0;

      }
    }
  }
}

.eod-header {
  margin-top: 50px;
  text-align: center;
  font-style: normal;
  font-weight: bold;
  font-size: 20px;
  line-height: 25px;
  color: #1D1D26;
}
</style>
