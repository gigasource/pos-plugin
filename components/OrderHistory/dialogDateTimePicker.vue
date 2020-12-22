<template>
  <g-dialog v-model="internalValue" width="900px" eager :fullscreen="isMobile">
    <div class="wrapper">
      <div class="dialog-title">
        <span>{{$t('orderHistory.dateTimeSelection')}}</span>
<!--        <g-icon size="20" svg @click="internalValue = false">icon-close</g-icon>-->
      </div>
      <g-date-range-picker v-model="selectedDatetime"/>
      <div class="action">
        <g-btn :uppercase="false" text @click="internalValue = false" outlined width="120" class="mr-2">
          {{$t('ui.cancel')}}
        </g-btn>
        <g-btn :uppercase="false" text @click="submit" backgroundColor="#2979FF" text-color="#FFFFFF" width="120">
          {{$t('ui.ok')}}
        </g-btn>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: 'dialogDateTimePicker',
    props: {
      modelValue: null,
      orderHistoryFilters: null,
    },
    injectService: ['PosStore:isMobile'],
    data: () => ({
      selectedDatetime: [],
      isMobile: null
    }),
    emits: ['update:modelValue', 'updateOrderHistoryFilter', 'getOrderHistory', 'getTotalOrders'],
    computed: {
      internalValue: {
        get() {
          return this.modelValue;
        },
        set(val) {
          this.$emit('update:modelValue', val);
        }
      }
    },
    methods: {
      async submit() {
        const datetimeFilter = {
          title: 'Datetime',
          text: this.selectedDatetime[0] + ' - ' + this.selectedDatetime[1],
          condition: { date: { '$gte': new Date(this.selectedDatetime[0] + ' 00:00:00'), '$lte': new Date(this.selectedDatetime[1] + ' 23:59:59') }}
        };
        this.$emit('updateOrderHistoryFilter', datetimeFilter)
        this.internalValue = false;
        await this.$emit('getOrderHistory');
        await this.$emit('getTotalOrders');
      }
    }
    ,
  }
</script>

<style lang="scss" scoped>
  .wrapper {
    width: 100%;
    background-color: #FFFFFF;

    .dialog-title {
      display: flex;
      justify-content: space-between;
      padding: 16px;
      font-size: 16px;
      line-height: 20px;
      font-weight: 700;
    }

    .action {
      padding: 16px;
      display: flex;
      justify-content: flex-end;

      .g-btn__outlined {
        border: 1px solid #979797;
        color: #1d1d26;
      }
    }
  }

  @media screen and (max-width: 1023px) {
    .wrapper {
      height: 100%;
      overflow: auto;

      .dialog-title {
        padding: 8px 8px 4px;
      }

      .g-date-range-picker {
        width: 100%;

        ::v-deep {
          .action-btns {
            padding: 0 8px 8px;

            & > .g-btn {
              height: 32px !important;
              margin-right: 8px;
              padding: 0 8px !important;
              font-size: 12px;
              margin-top: 4px;
            }

            & ~ div:not(.g-divider) {
              padding: 0 8px !important;
            }

            & ~ div.pa-3 {
              padding-bottom: 8px !important;

              label {
                margin-bottom: 0;
              }

              select {
                height: auto;
                padding: 4px 32px 4px 8px;
                margin-top: 4px;
              }
            }
          }

          .g-date-range-picker {
            &__header {
              padding: 4px
            }

            &__date {
              padding: 4px;

              table {
                tr {
                  height: 24px;

                  th {
                    padding: 4px 0;
                    font-size: 13px;
                  }

                  td {
                    .g-table-item {
                      font-size: 12px;
                      height: 20px;
                      width: 20px;
                      top: 2px;
                      padding: 0 2px;

                      &__background {
                        height: 20px;
                        top: 2px;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      .action {
        padding: 8px 0;

        .g-btn {
          height: 32px !important;
          margin-right: 8px;
          padding: 0 8px !important;
          font-size: 12px;
        }
      }
    }
  }
</style>
