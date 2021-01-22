<script>
import dayjs from 'dayjs';
import { useRoute } from 'vue-router';
import { onBeforeMount, computed } from 'vue';
import { $filters } from '../AppSharedStates';
import { useI18n } from 'vue-i18n';
import { GIcon, GTabItem, GTabs, GToolbar } from '../../../../backoffice/pos-vue-framework';

export default {
  components: [GTabs, GTabItem, GToolbar, GIcon],
  setup() {
    const { t } = useI18n()
    const selectedStaff = ref(null)
    const staffs = ref([])
    const orderSalesByStaff = ref(null)
    // PosStore: inject
    const systemDate = ref(null)
    const dateFormat = ref(null)
    const timeFormat = ref(null)
    // SettingsStore inject
    const listUsers = ref([])
    const reportDate = computed(() => {
      return dayjs(systemDate.value).format(dateFormat.value)
    })
    watch(() => selectedStaff.value, async (newV) => {
      if (!newV) {
        return []
      }
      //todo: getOrderSalesByStaff
      orderSalesByStaff.value = await getOrderSalesByStaff(newV.name, systemDate.value)
    })

    const router = useRoute()

    function back() {
      router.push({ path: '/pos-dashboard' })
    }

    //todo: printStaffReport
    async function print() {
      if (!orderSalesByStaff.value) {
        return
      }
      return await printStaffReport(orderSalesByStaff.value)
    }

    function getFormattedTime(val) {
      return val ? dayjs(val).format(`${dateFormat} ${timeFormat}`) : ''
    }

    // inject service
    function getListUsers() {
    }

    function getOrderSalesByStaff() {
    }

    function printStaffReport() {
    }


    // async mounted() {
    //   setTimeout(async () => {
    //     await this.getListUsers();
    //     this.staffs = this.listUsers;
    //     this.selectedStaff = this.staffs.length && this.staffs[0]
    //   }, 100)
    // },
    // async activated() {
    //   await this.getListUsers();
    //   this.staffs = this.listUsers;
    //   this.selectedStaff = this.staffs.length && this.staffs[0]
    // }

    // fixme:
    // onBeforeMount(async() => {
    //   await getListUsers();
    //   staffs.value = listUsers.value;
    //   selectedStaff.value = staffs.value.length && staffs.value[0]
    // })

    return () => <>
      <div class="staff-report-view">
        <div class="staff-report-content">
          {(staffs.value.length) &&
          <g-tabs items={staffs.value} showArrows={false}
                  vertical={true} color="#F2F2F2"
                  slider-color="#2979FF" slider-size="4px"
                  text-color="#000000" v-model={selectedStaff.value}
                  v-slots={{
                    'default': () => <> {staffs.value.map((item, i) =>
                        <g-tab-item item={item} key={i}>
                          <div class="detail-header">
                            {t('report.staffName')}: {item.name}
                          </div>
                          {
                            (orderSalesByStaff.value && orderSalesByStaff.value.user[orderSalesByStaff.value.name]) &&
                            <div>
                              <div class="detail-header">
                                {t('report.reportDate')}: {reportDate.value} </div>
                              <div class="detail-time">
                                {t('report.firstOrder')}:
                                {getFormattedTime(orderSalesByStaff.value.user[orderSalesByStaff.value.name].from)}
                              </div>
                              <div class="detail-time">
                                {t('report.lastOrder')}:
                                {getFormattedTime(orderSalesByStaff.value.user[orderSalesByStaff.value.name].to)}
                              </div>
                            </div>
                          }
                          <div class="sales-details-header">
                            {t('common.sales')}
                          </div>
                          {
                            (orderSalesByStaff.value && orderSalesByStaff.value.user[orderSalesByStaff.value.name]) &&
                            <div>
                              <p>
                                <span class="sales-entry sales-type">
                                  {t('common.total')}
                                </span>
                                <span class="sales-entry sales-amount">
                                  {$filters.formatCurrency(orderSalesByStaff.value.user[orderSalesByStaff.value.name].vSum)}
                                </span>
                              </p>
                              <p>
                                <span class="sales-entry sales-type">
                                  {t('common.subtotal')}
                                </span>
                                <span class="sales-entry sales-amount">
                                  {$filters.formatCurrency(orderSalesByStaff.value.user[orderSalesByStaff.value.name].net)}
                                </span>
                              </p>
                              <p>
                                <span class="sales-entry sales-type">
                                  {t('common.tax')} </span>
                                <span class="sales-entry sales-amount">
                                  {$filters.formatCurrency(orderSalesByStaff.value.user[orderSalesByStaff.value.name].tax)}
                                </span>
                              </p>
                            </div>
                          }
                          <div class="tax-detail">
                            {
                              (orderSalesByStaff.value && orderSalesByStaff.value['groupByTax']) &&
                              <div>
                                {orderSalesByStaff.value['groupByTax'].map((entry, key, index) =>
                                    <div>
                                      <p class="sales-entry sales-type">
                                        {t('common.tax')} {key}%:
                                      </p>
                                      <p>
                                        <span class="sales-entry sales-type">
                                          {t('common.total')}
                                        </span>
                                        <span class="sales-entry sales-amount">
                                          {$filters.formatCurrency(entry.gross)}
                                        </span>
                                      </p>
                                      <p>
                                        <span class="sales-entry sales-type">
                                          {t('common.subtotal')}
                                        </span>
                                        <span class="sales-entry sales-amount">
                                          {$filters.formatCurrency(entry.net)}
                                        </span>
                                      </p>
                                      <p>
                                        <span class="sales-entry sales-type">
                                          {t('common.tax')}
                                        </span>
                                        <span class="sales-entry sales-amount">
                                          {$filters.formatCurrency(entry.salesTax)}
                                        </span>
                                      </p>
                                      <br> </br>
                                    </div>
                                )}
                              </div>
                            }
                            {
                              (orderSalesByStaff.value && orderSalesByStaff.value.user[orderSalesByStaff.value.name]) &&
                              <div>
                                <p>
                                  <span class="sales-entry sales-type">
                                    {t('report.vouchersSold')}
                                  </span>
                                  <span class="sales-entry sales-amount">
                                    {$filters.formatCurrency(0)}
                                  </span>
                                </p>
                                <p>
                                  <span class="sales-entry sales-type">
                                    {t('report.vouchersUsed')}
                                  </span>
                                  <span class="sales-entry sales-amount">
                                    {$filters.formatCurrency(0)}
                                  </span>
                                </p>
                                <p>
                                  <span class="sales-entry sales-type">
                                    {t('common.discount')}
                                  </span>
                                  <span class="sales-entry sales-amount">
                                    {
                                      $filters.formatCurrency(orderSalesByStaff.value.user[orderSalesByStaff.value.name].discount)
                                    }
                                  </span>
                                </p>
                              </div>
                            }
                          </div>
                          {
                            (orderSalesByStaff.value && orderSalesByStaff.value['groupByPayment']) &&
                            <div class="sales-details">
                              {orderSalesByStaff.value['groupByPayment'].map((sale, key, index) =>
                                  <p key={index}>
                                    <span class="sales-entry sales-type">
                                      {key} {t('common.sales')}:
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
                        </g-tab-item>
                    )} </>,
                    'tab': ({ item, index }) => <>
                      <g-tab item={item} key={index} active-text-color="#000000">
                        <p class="tab-username">
                          {item.name}
                        </p>
                      </g-tab>
                    </>
                  }}>
          </g-tabs>
          }
        </div>
        <g-toolbar bottom color="#EEEEEE">
          <g-btn uppercase={false} onClick={back} width="94px">
            <g-icon class="mr-2" svg>
              icon-back
            </g-icon>
            {t('ui.back')}
          </g-btn>
          <g-spacer></g-spacer>
          <g-btn uppercase={false} onClick={print} background-color="#2979FF" text-color="#FFFFFF">
            <g-icon class="mr-2" svg>
              icon-print2
            </g-icon>
            {t('report.printReport')}
          </g-btn>
        </g-toolbar>
      </div>
    </>
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
