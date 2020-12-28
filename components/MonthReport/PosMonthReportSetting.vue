<template>
  <div class="setting-wrapper">
    <g-date-picker-input :label="$t('report.from')" v-model="from" class="mt-5"/>
    <g-date-picker-input :label="$t('report.to')" v-model="to"/>
    <pos-switch dense :label="$t('report.showProductSold')" v-model="showProductSold"/>
    <pos-switch dense :label="$t('report.showZ')" v-model="showAllZNumber" class="mt-5"/>
  </div>
</template>

<script>
  export default {
    name: 'PosMonthReportSetting',
    injectService: ['ReportsStore:(selectedMonth,monthReportFrom,monthReportTo,showProductSold,showAllZNumber,getMonthReport)'],
    data() {
      return {
        // inject
        selectedMonth: null,
        monthReportFrom: null,
        monthReportTo: null,
        showProductSold: null,
        showAllZNumber: null
      }
    },
    computed: {
      from: {
        get() {
          return this.monthReportFrom
        },
        set(val) {
          this.monthReportFrom = val
          this.updateMonth()
        }
      },
      to: {
        get() {
          return this.monthReportTo
        },
        set(val) {
          this.monthReportTo = val
          this.updateMonth()
        }
      },
    },
    methods: {
      async updateMonth() {
        const start = dayjs(this.monthReportFrom)
        const end = dayjs(this.monthReportTo)
        if (start.isSame(end, 'month')) {
          this.selectedMonth = start.endOf('month')
        } else {
          this.selectedMonth = dayjs()
        }
        await this.getMonthReport()
      },
      // inject
      getMonthReport() {
        console.error('ReportsStore:getMonthReport was not injected.')
      }
    }
  }
</script>

<style scoped lang="scss">
  .setting-wrapper {
    padding: 32px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);

    ::v-deep .g-tf-wrapper {
      .g-tf-prepend__outer {
        border: 1px solid #979797;
        border-right: none;
        border-top-left-radius: 2px;
        border-bottom-left-radius: 2px;
        background-color: #EFEFEF;
        padding: 8px;
        margin: 0;

        .g-icon {
          font-size: 20px !important;
          width: 20px !important;
          height: 20px !important;
          color: #424242 !important;
        }
      }

      fieldset {
        border: 1px solid #979797;
        border-top-right-radius: 2px;
        border-bottom-right-radius: 2px;

        .g-tf::before {
          background-color: unset;
        }

        .inputGroup {
          .input {
            div span {
              padding: 9px;
              font-size: 14px;
              line-height: 18px !important;
              color: #1D1D26;
              height: auto !important;
            }

            .g-tf-input {
              display: none;
            }
          }
        }


        .g-tf-label__active {
          transform: translate(-32px, -32px);
          color: #000;
          font-size: 14px;
          line-height: 18px;
          font-weight: 700;
        }
      }
    }

    .g-switch-wrapper {
      ::v-deep .g-switch-label {
        font-weight: 700;
        font-size: 14px;
        line-height: 18px;
        color: #000;
      }
    }
  }

  @media screen and (max-width: 1023px) {
    .setting-wrapper {
      padding: 8px;
      height: 100%;
      overflow: auto;

      & > div {
        margin: 16px 0 0 !important;

        ::v-deep .g-tf-wrapper {
          margin-bottom: 4px;
        }

        ::v-deep .g-switch-container {
          display: block;
        }
      }
    }
  }
</style>

<style lang="scss">
  @media screen and (max-height: 375px) {
    .g-picker .g-picker__title {
      display: none;
    }
  }
</style>
