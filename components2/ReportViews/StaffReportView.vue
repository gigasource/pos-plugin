<script>
import dayjs from 'dayjs';
import {onActivated, ref} from 'vue';
import {$filters} from '../AppSharedStates';
import {useI18n} from 'vue-i18n';
import {GIcon, GTabItem, GTabs, GToolbar} from '../../../../backoffice/pos-vue-framework';
import {backFn, dateFormat, genScopeId, timeFormat} from "../utils";
import {
  getListUsers,
  getStaffReport,
  groupByPayment, printStaffReport,
  reportDate,
  selectedStaff,
  staffs,
  userSales
} from "./staf-report-logic";
import _ from 'lodash';

export default {
  components: [GTabs, GTabItem, GToolbar, GIcon],
  setup() {
    const {t} = useI18n()

    //todo: printStaffReport
    async function print() {
      return await printStaffReport()
    }

    function getFormattedTime(val) {
      return val ? dayjs(val).format(`${dateFormat.value} ${timeFormat.value}`) : ''
    }

    onActivated(async () => {
      await getListUsers();
      await getStaffReport();
    })
    getListUsers()
    getStaffReport();

    const genSalesDetail = (user) => {
      return <>
        {
          userSales.value && userSales.value[user] &&
          <div>
            <div class="detail-header">
              {t('report.reportDate')}: {reportDate.value} </div>
            <div class="detail-time">
              {t('report.firstOrder')}:
              {getFormattedTime(userSales.value[user].from)}
            </div>
            <div class="detail-time">
              {t('report.lastOrder')}:
              {getFormattedTime(userSales.value[user].to)}
            </div>
          </div>
        }
        <div class="sales-details-header">
          {t('common.sales')}
        </div>
        {
          userSales.value && userSales.value[user] &&
          <div>
            <p>
              <span class="sales-entry sales-type">
                {t('common.total')}
              </span>
              <span class="sales-entry sales-amount">
                {$filters.formatCurrency(userSales.value[user].vTaxSum.gross)}
              </span>
            </p>
            <p>
              <span class="sales-entry sales-type">
                {t('common.subtotal')}
              </span>
              <span class="sales-entry sales-amount">
                {$filters.formatCurrency(userSales.value[user].vTaxSum.net)}
              </span>
            </p>
            <p>
              <span class="sales-entry sales-type">
                {t('common.tax')} </span>
              <span class="sales-entry sales-amount">
                {$filters.formatCurrency(userSales.value[user].vTaxSum.tax)}
              </span>
            </p>
          </div>
        }
      </>
    }

    const genTaxesDetail = (user) => {
      return <>
        <div className="tax-detail">
          {
            userSales.value && userSales.value[user] && userSales.value[user].vTaxSum &&
            <div>
              {_.map(userSales.value[user].vTaxSum.vTaxSum, (taxObject, taxPercent, index) =>
                  <div key={index}>
                    <p className="sales-entry sales-type">
                      {t('common.tax')} {taxPercent}%:
                    </p>
                    <p>
                      <span className="sales-entry sales-type">
                        {t('common.total')}
                      </span>
                      <span className="sales-entry sales-amount">
                        {$filters.formatCurrency(taxObject.gross)}
                      </span>
                    </p>
                    <p>
                      <span className="sales-entry sales-type">
                        {t('common.subtotal')}
                      </span>
                      <span className="sales-entry sales-amount">
                        {$filters.formatCurrency(taxObject.net)}
                      </span>
                    </p>
                    <p>
                      <span className="sales-entry sales-type">
                        {t('common.tax')}
                      </span>
                      <span className="sales-entry sales-amount">
                        {$filters.formatCurrency(taxObject.tax)}
                      </span>
                    </p>
                    <br> </br>
                  </div>
              )}
            </div>
          }
          {
            userSales.value && userSales.value[user] &&
            <div>
              <p>
                <span className="sales-entry sales-type">
                  {t('report.vouchersSold')}
                </span>
                <span className="sales-entry sales-amount">
                  {$filters.formatCurrency(0)}
                </span>
              </p>
              <p>
                <span className="sales-entry sales-type">
                  {t('report.vouchersUsed')}
                </span>
                <span className="sales-entry sales-amount">
                  {$filters.formatCurrency(0)}
                </span>
              </p>
              <p>
                <span className="sales-entry sales-type">
                  {t('common.discount')}
                </span>
                <span className="sales-entry sales-amount">
                  {
                    $filters.formatCurrency(userSales.value[user].vDiscount)
                  }
                </span>
              </p>
            </div>
          }
        </div>
      </>
    }

    //todo: voucher
    //todo: cancellation
    const genPayment = (user) => {
      return groupByPayment.value && groupByPayment.value[user] &&
          <div class="sales-details">
            {_.map(groupByPayment.value[user], (sale, paymentType, index) =>
                <p key={index}>
                  <span class="sales-entry sales-type">
                    {paymentType} {t('common.sales')}:
                  </span>
                  <span class="sales-entry">
                    {$filters.formatCurrency(sale)}
                  </span>
                </p>
            )}<p>
            <span class="sales-entry sales-type">
              {t('report.returnedTotal')}:
            </span>
            <span class="sales-entry">
              {$filters.formatCurrency(0)}
            </span>
          </p>
          </div>
    }

    return genScopeId(() => (
        <div class="staff-report-view">
          <div class="staff-report-content">
            {staffs.value.length &&
            <g-tabs items={staffs.value} showArrows={false}
                    vertical={true} color="#F2F2F2"
                    slider-color="#2979FF" slider-size="4px"
                    text-color="#000000" v-model={selectedStaff.value}
                    v-slots={{
                      default: () => staffs.value.map((item, i) =>
                          <g-tab-item item={item} key={i}>
                            <div class="detail-header">
                              {t('report.staffName')}: {item.name}
                            </div>
                            {genSalesDetail(item.name)}
                            {genTaxesDetail(item.name)}
                            {genPayment(item.name)}
                          </g-tab-item>
                      ),
                      tab: ({item, index}) =>
                          <g-tab item={item} key={index} active-text-color="#000000">
                            <p class="tab-username">
                              {item.name}
                            </p>
                          </g-tab>
                    }}/>
            }
          </div>
          <g-toolbar bottom color="#EEEEEE">
            <g-btn uppercase={false} onClick={backFn.value} width="94px">
              <g-icon class="mr-2" svg>icon-back</g-icon>
              {t('ui.back')}
            </g-btn>
            <g-spacer></g-spacer>
            <g-btn uppercase={false} onClick={print} background-color="#2979FF" text-color="#FFFFFF">
              <g-icon class="mr-2" svg>icon-print2</g-icon>
              {t('report.printReport')}
            </g-btn>
          </g-toolbar>
        </div>
    ))
  }
}
</script>

<style lang="scss" scoped>
.staff-report-view {
  width: 100%;
  background-color: #fff;
  position: relative;
  height: 100%;

  .staff-report-content {
    height: 100%;

    .detail-header {
      font-weight: bold;
      font-size: 16px;
      line-height: 27px;
    }

    .detail-time {
      font-size: 14px;
      line-height: 25px;
      font-family: "Muli", sans-serif;
    }

    .sales-details {
      border-top: 1px dashed #000000;
    }

    .sales-details-header {
      font-weight: bold;
      font-size: 16px;
      line-height: 33px;
      border-top: 1px dashed #000000;
    }

    .tax-detail {
      border-top: 1px dashed #000000;
    }

    .sales-entry {
      font-size: 14px;
      line-height: 25px;
    }

    .sales-type {
      text-transform: capitalize;
    }

    .sales-amount {
      float: right;
    }

    .g-tab {
      height: 99px;
      width: 190px;
      background-color: #ffffff;
    }

    .g-tab:hover:before {
      opacity: 0;
    }

    .g-tab:not(.g-tab__active) {
      height: 99px;
      width: 190px;
      background-color: #F9F9F9;
    }

    .tab-username {
      text-transform: uppercase;
      white-space: normal;
    }

    ::v-deep .g-tabs-wrapper {
      height: calc(100% - 64px);

      .g-tabs__vertical {
        .g-tabs-bar {
          overflow-y: auto;
          -ms-overflow-style: none;
        }

        /* Hide scrollbar for Chrome, Safari and Opera */
        .g-tabs-bar::-webkit-scrollbar {
          display: none;
        }
      }

      .g-tab-items {
        height: 100%;
        overflow-y: auto;

        .g-tab-item {
          padding: 40px 50px;
          background-color: #ffffff;
        }

      }

      .g-tabs-slider {
        z-index: 2;
      }
    }

  }
}
</style>
