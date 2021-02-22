<script>
import {useI18n} from 'vue-i18n';
import {$filters} from "../AppSharedStates";
import {reportsInSelectedDate, selectedReport, selectedReportDate} from './eod-shared';
import {formatDatetime, formatTime, genScopeId} from "../utils";

export default {
  name: 'PosEndOfDayDetails',
  setup() {
    const {t} = useI18n()
    return genScopeId(() => (
        <>
          {reportsInSelectedDate.value.length > 0 &&
          <g-tabs items={reportsInSelectedDate.value} color="#F2F2F2" text-color="#000000"
                  v-model={selectedReport.value}
                  showArrows={false}
                  slider-size="0" v-slots={{
            default: () => reportsInSelectedDate.value.map((item, i) =>
                <g-tab-item item={item} key={i}>
                  <div class="eod-info">
                    <span class="eod-info-important"> Date: </span>
                    <span> {formatDatetime(selectedReportDate.value.date)} </span>
                  </div>
                  <div class="eod-info">
                    <span class="eod-info-important">
                      {t('report.zNumber')}: </span>
                    <span>
                      {item.z} </span>
                  </div>
                  <div class="eod-info">
                    <span class="eod-info-important">
                      {t('report.firstOrder')}: </span>
                    <span>
                      {formatDatetime(item.begin)} </span>
                  </div>
                  <div class="eod-info">
                    <span class="eod-info-important">
                      {t('report.lastOrder')}: </span>
                    <span>
                      {formatDatetime(item.end)} </span>
                  </div>
                  <div class="eod-info">
                    <span class="eod-info-important">
                      {t('report.totalSales')}: </span>
                    <span class="eod-info-total-sale">
                      € {$filters.formatCurrency(item.sum)} </span>
                  </div>
                </g-tab-item>
            ),
            tab: ({item, index}) => <>
              <g-tab item={item} key={index} active-text-color="#000000">
                <p class="eod-tab-title">
                  Z: {item.z} </p>
                <p class="eod-tab-subtitle">
                  {formatTime(item.begin)} - {formatTime(item.end)} </p>
              </g-tab>
            </>
          }}/>
          }
        </>
    ))

  }
}
</script>

<style lang="scss" scoped>
.g-tabs-wrapper {
  height: 100%;
  box-shadow: -1px 0px 6px rgba(0, 0, 0, 0.25);

  :deep .g-tabs {
    .g-tabs-bar {
      .g-slide-group {
        .g-slide-group__wrapper {
          .g-slide-group__content {
            height: 65px;
          }
        }
      }
    }
  }

  :deep .eod-tab-title {
    font-style: normal;
    font-weight: bold;
    font-size: 18px;
    line-height: 30px;
    color: #1D1D26;
  }

  :deep .eod-tab-subtitle {
    font-style: normal;
    font-weight: bold;
    font-size: 8px;
    line-height: 15px;
    color: #9E9E9E;
  }

  :deep .g-tab:hover:before {
    opacity: 0;
  }

  :deep .g-tab {
    height: 65px;
    border-right: 1px solid #E0E0E0;
    background-color: #ffffff;
  }

  :deep .g-tab:not(.g-tab__active) {
    height: 65px;
    border-top: 4px solid transparent;
    background-color: #F2F2F2;
  }

  :deep .g-tab.g-tab__active {
    border-top: 4px solid #2979FF;
  }

  ::v-deep .g-tab-items {
    .g-tab-item {
      padding: 12px;
      background-color: #ffffff;

      .eod-info {
        display: flex;
        height: 40px;
        justify-content: space-between;
        align-items: center;
        font-size: 13px;
        line-height: 16px;
      }

      .eod-info:last-child {
        background-image: linear-gradient(to right, #333 40%, rgba(255, 255, 255, 0) 20%);
        background-position: top;
        background-size: 6px 1px;
        background-repeat: repeat-x;
      }

      .eod-info-important {
        font-weight: bold;
      }

      .eod-info-total-sale {
        font-size: 18px;
        line-height: 23px;
        font-weight: bold;
        color: #1271FF;
      }
    }

  }
}
</style>
