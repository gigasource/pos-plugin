<template>
  <div class="setting-wrapper">
    <g-date-picker-input label="From:" v-model="from" class="mt-5"/>
    <g-date-picker-input label="To:" v-model="to"/>
    <pos-switch dense label="Show Product Sold" v-model="showProductSold"/>
    <pos-switch dense label="Show All Z-Number" v-model="showAllZNumber" class="mt-5"/>
  </div>
</template>

<script>
  export default {
    name: 'PosMonthReportSetting',
    injectService: ['PosStore:(selectedMonth,monthReportFrom,monthReportTo,showProductSold,showAllZNumber,getMonthReport)'],
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
</style>
