<script>
import {useI18n} from 'vue-i18n';
import dayjs from "dayjs";
import {computed, ref, watch} from "vue";
import {$filters} from "../AppSharedStates";
import {selectedReportDate} from "./eod-shared";

export default {
  props: ['modelValue'],
  setup() {
    const {t} = useI18n()

    const model = ref({})
    const zNumberReports = ref([])
    const timeFormat = ref('')
    const dateFormat = ref('')

    const selectedDate = computed(() => {
      if (selectedReportDate.value && selectedReportDate.value.date) {
        return dayjs(selectedReportDate.value.date).format(dateFormat.value)
      }
      return '';
    })

    const selectedTab = computed({
      get() {
        return model.value;
      },
      set(value) {
        model.value = value
        emit('update:modelValue', value);
      }
    })

    /**
     * selectedReportDate: .reports, .date
     * reports -> begin, end, sum , z
     */
    //fixme: remove watch
    watch(selectedReportDate, (newVal, oldVal) => {
      if (selectedReportDate.value.reports && selectedReportDate.value.reports.length) {
        zNumberReports.value = selectedReportDate.value.reports.map(report => ({
          begin: dayjs(report.begin).format(timeFormat.value),
          end: dayjs(report.end).format(timeFormat.value),
          sum: report.sum,
          z: report.z
        }))

        model.value = zNumberReports.value[zNumberReports.value.length - 1]
      } else {
        zNumberReports.value = []
        model.value = null
      }
    })

    return () => <>
      <div>
        {(zNumberReports.value.length > 0) &&
        <g-tabs items={zNumberReports.value} color="#F2F2F2" text-color="#000000" v-model={selectedTab.value} showArrows={false}
                slider-size="0" v-slots={{
          default: () => <> {zNumberReports.value.map((item, i) =>
              <g-tab-item item={item} key={i}>
                <div class="eod-info">
                  <span class="eod-info-important"> Date: </span>
                  <span> {selectedDate.value} </span>
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
                    {item.begin} </span>
                </div>
                <div class="eod-info">
                  <span class="eod-info-important">
                    {t('report.lastOrder')}: </span>
                  <span>
                    {item.end} </span>
                </div>
                <div class="eod-info">
                  <span class="eod-info-important">
                    {t('report.totalSales')}: </span>
                  <span class="eod-info-total-sale">
                    € {$filters.formatCurrency(item.sum)} </span>
                </div>
              </g-tab-item>
          )} </>,
          tab: ({item, index}) => <>
            <g-tab item={item} key={index} active-text-color="#000000">
              <p class="eod-tab-title">
                Z: {item.z} </p>
              <p class="eod-tab-subtitle">
                {item.begin} - {item.end} </p>
            </g-tab>
          </>
        }}/>
        }
      </div>
    </>

  }
}
</script>

<style lang="scss" scoped>
.g-tabs-wrapper {
  height: 100%;
  box-shadow: -1px 0px 6px rgba(0, 0, 0, 0.25);

  ::v-deep .g-tabs {
    .g-tabs-bar {
      .g-slide-group {
        .g-slide-group__wrapper {
          .g-slide-group__content {
            height: 85px;
          }
        }
      }
    }
  }

  .eod-tab-title {
    font-style: normal;
    font-weight: bold;
    font-size: 20px;
    line-height: 30px;
    color: #1D1D26;
  }

  .eod-tab-subtitle {
    font-style: normal;
    font-weight: bold;
    font-size: 12px;
    line-height: 15px;
    color: #9E9E9E;
  }

  .g-tab:hover:before {
    opacity: 0;
  }

  .g-tab {
    height: 85px;
    border-right: 1px solid #E0E0E0;
    background-color: #ffffff;
  }

  .g-tab:not(.g-tab__active) {
    height: 85px;
    border-top: 4px solid transparent;
    background-color: #F2F2F2;
  }

  .g-tab.g-tab__active {
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
