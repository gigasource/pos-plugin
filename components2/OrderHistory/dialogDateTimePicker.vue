<script>
import { genScopeId, internalValueFactory } from '../utils';
import { isMobile } from '../AppSharedStates';
import { ref } from 'vue'
import { useI18n } from 'vue-i18n';

export default {
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emit: ['submit', 'update:modelValue'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const selectedDatetime = ref(null)
    const internalValue = internalValueFactory(props, { emit })

    async function submit() {
      emit('submit', selectedDatetime.value)
      internalValue.value = false
    }

    return genScopeId(() =>
        <g-dialog v-model={internalValue.value} width="900px" eager fullscreen={isMobile.value}>
          {genScopeId(() =>
              <div class="wrapper">
                <div class="dialog-title">
                  <span>
                    {t('orderHistory.dateTimeSelection')}
                  </span>
                </div>
                <g-date-range-picker v-model={selectedDatetime.value}/>
                <div class="action">
                  <g-btn uppercase={false} text onClick={() => internalValue.value = false} outlined width="120" class="mr-2">
                    {t('ui.cancel')}
                  </g-btn>
                  <g-btn uppercase={false} text onClick={submit} backgroundColor="#2979FF" text-color="#FFFFFF" width="120">
                    {t('ui.ok')}
                  </g-btn>
                </div>
              </div>)()
          }
        </g-dialog>
    )
  }
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
