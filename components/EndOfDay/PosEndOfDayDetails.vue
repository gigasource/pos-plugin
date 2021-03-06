<template>
  <div>
    <g-tabs :items="zNumberReports"
            v-if="zNumberReports.length > 0"
            color='#F2F2F2'
            text-color="#000000"
            v-model="selectedTab"
            :show-arrows="false"
            slider-size="0"
    >
      <g-tab-item v-for="(item, i) in zNumberReports" :item="item" :key="i">
        <div class="eod-info">
          <span class="eod-info-important">Date:</span>
          <span>{{selectedDate}}</span>
        </div>
        <div class="eod-info">
          <span class="eod-info-important">Z - Number:</span>
          <span>{{item.z}}</span>
        </div>
        <div class="eod-info">
          <span class="eod-info-important">First Order:</span>
          <span>{{item.begin}}</span>
        </div>
        <div class="eod-info">
          <span class="eod-info-important">Last Order:</span>
          <span>{{item.end}}</span>
        </div>
        <div class="eod-info">
          <span class="eod-info-important">Total Sales:</span>
          <span class="eod-info-total-sale">€ {{item.sum.toFixed(2)}}</span>
        </div>
      </g-tab-item>
      <template #tab="{item, index}">
        <g-tab :item="item" :key="index" active-text-color="#000000">
          <p class="eod-tab-title">Z: {{item.z}}</p>
          <p class="eod-tab-subtitle">{{item.begin}} - {{item.end}}</p>
        </g-tab>
      </template>
    </g-tabs>
  </div>
</template>

<script>
  import dayjs from 'dayjs'

  export default {
    name: 'PosEndOfDayDetails',
    injectService: [
      'PosStore:selectedReportDate',
    ],
    data() {
      return {
        model: {},
        zNumberReports: []
      }
    },
    computed: {
      selectedDate() {
        if (this.selectedReportDate && this.selectedReportDate.date) {
          return dayjs(this.selectedReportDate.date).format('DD/MM/YYYY')
        }
        return '';
      },
      selectedTab: {
        get() {
          return this.model
        },
        set(value) {
          this.model = value
          this.$emit('input', value);
        }
      }
    },
    created() {
      const posStore = this.$getService('PosStore')

      this.unwatch = posStore.$watch('selectedReportDate', newVal => {
        if (newVal.reports && newVal.reports.length) {
          this.zNumberReports = newVal.reports.map(report => ({
            begin: dayjs(report.begin).format('HH:mm'),
            end: dayjs(report.end).format('HH:mm'),
            sum: report.sum,
            z: report.z
          }))

          this.model = this.zNumberReports[this.zNumberReports.length - 1]
        } else {
          this.zNumberReports = []
          this.model = null
        }
      }, { deep: true })
    },
    beforeDestroy() {
      this.unwatch()
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
