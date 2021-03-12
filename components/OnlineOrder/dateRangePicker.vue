<script>
import { ref, computed } from 'vue'
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useI18n } from 'vue-i18n';
import { genScopeId } from "../utils";

dayjs.extend(customParseFormat)
// format used in current app
const DATE_FORMAT = 'DD/MM/YYYY'
// format used by date picker
const DATE_PICKER_FORMAT = 'YYYY-MM-DD'

export default {
  props: ['from', 'to'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const showMenu = ref(false)
    const showFromDatePicker = ref(false)
    const showToDatePicker = ref(false)
    const today = dayjs().format(DATE_PICKER_FORMAT);
    const fromDate = ref(props.from || today)
    const toDate = ref(props.to || today)
    const formattedRange = computed(() => {
      let from = dayjs(fromDate.value, DATE_PICKER_FORMAT).format('MMM DD');
      let to = dayjs(toDate.value, DATE_PICKER_FORMAT).format('MMM DD');
      return from === to ? `${from}` : `${from} - ${to}`
    })
    const formattedFromDate = computed(() => {
      return dayjs(fromDate.value).format(DATE_FORMAT)
    })
    const formattedToDate = computed(() => {
      return dayjs(toDate.value.value).format(DATE_FORMAT)
    })

    function onFromDateSelected(dateValue) {
      fromDate.value = dateValue
      showFromDatePicker.value = false
    }
    function onToDateSelected(dateValue) {
      toDate.value = dateValue
      showToDatePicker.value = false
    }
    function selectToday() {
      const today = dayjs().format(DATE_PICKER_FORMAT)
      fromDate.value = today
      toDate.value = today
    }
    function selectYesterday() {
      const yesterday = dayjs().subtract(1, 'day').format(DATE_PICKER_FORMAT)
      fromDate.value = yesterday
      toDate.value = yesterday
    }
    function selectCurrentWeek() {
      fromDate.value = dayjs().startOf('week').format(DATE_PICKER_FORMAT)
      toDate.value = dayjs().format(DATE_PICKER_FORMAT)
    }
    function selectCurrentMonth() {
      fromDate.value = dayjs(`${dayjs().format('YYYY-MM')}-01`, 'YYYY-MM-DD').format(DATE_PICKER_FORMAT)
      toDate.value = dayjs().format(DATE_PICKER_FORMAT)
    }
    function goPrev() {
      let days = dayjs(toDate.value).diff(fromDate.value, 'day')
      if (days === 0) {
        days = 1
      }
      fromDate.value = dayjs(fromDate.value).subtract(days, 'day').format(DATE_PICKER_FORMAT)
      toDate.value = dayjs(toDate.value).subtract(days, 'day').format(DATE_PICKER_FORMAT)
      emit('save', { fromDate: fromDate.value, toDate: toDate.value })
    }
    function goNext() {
      let days = dayjs(toDate.value).diff(fromDate.value, 'day')
      if (days === 0) {
        days = 1
      }
      const nextFromDate = dayjs(fromDate.value).add(days, 'day')
      const nextToDate = dayjs(toDate.value).add(days, 'day')
      const today = dayjs()
      fromDate.value = (nextFromDate.isAfter(today) ? today : nextFromDate).format(DATE_PICKER_FORMAT)
      toDate.value = (nextToDate.isAfter(today) ? today : nextToDate).format(DATE_PICKER_FORMAT)
      emit('save', { fromDate: fromDate.value, toDate: toDate.value })
    }
    function save() {
      showMenu.value = false
      emit('save', { fromDate: fromDate.value, toDate: toDate.value })
    }
    return genScopeId(() => <>
      <div class={['date-range-picker', showMenu.value && 'date-range-picker__active']}>
        <div class="date-range-picker__nav left" onClick={goPrev}>
          <g-icon>
            chevron_left
          </g-icon>
        </div>
        <g-menu v-model={showMenu.value} minWidth={100} maxWidth={333} nudge-bottom="10" nudge-left="70" closeOnClick={true} contentFillWidth={false} content-class="aw-date-range-picker-content" v-slots={{
          'default': genScopeId(() => <>
            <div class="date-range-picker__container">
              <div class="arrow-top"/>
              <div style="display: flex; margin-bottom: 10px;">
                <div style="width: 50%">
                  <div class="date-range-picker__label">
                    {t('onlineOrder.from')} </div>
                  <g-menu v-model={showFromDatePicker.value} nudge-bottom="10" content-class="date-picker-content" v-slots={{
                    'default': genScopeId(() =>
                      <g-date-picker max={toDate.value} type="date" no-title onUpdate:modelValue={onFromDateSelected}/>
                    )
                    ,
                    'activator': genScopeId(({ on }) =>
                      <div class="date-range-picker__input--from" onClick={on.click}>
                        <g-icon size="16">
                          far fa-calendar-alt
                        </g-icon>
                        <span class="date-range-picker__date">
                          {formattedFromDate.value} </span>
                      </div>
                    )
                  }}/>
                </div>
                <div style="width: 50%">
                  <div class="date-range-picker__label">
                    {t('onlineOrder.to')} </div>
                  <g-menu v-model={showToDatePicker.value} nudge-bottom="10" content-class="date-picker-content" v-slots={{
                    'default': genScopeId(() =>
                      <g-date-picker min={fromDate.value} max={today} type="date" no-title onUpdate:modelValue={onToDateSelected}/>
                    )
                    ,
                    'activator': genScopeId(({ on }) =>
                      <div class="date-range-picker__input--to" onClick={on.click}>
                        <g-icon size="16">
                          far fa-calendar-alt
                        </g-icon>
                        <span class="date-range-picker__date">
                          {formattedToDate.value} </span>
                      </div>
                    )
                  }}/>
                </div>
              </div>
              <g-btn-bs height="40" width="100%" background-color="#1976D2" text-color="#fff" onClick={save}>
                {t('dialogs.confirm')}
              </g-btn-bs>
              <g-divider style="margin: 8px 0" color="#e0e0e0"/>
              <div class="row-flex flex-wrap w-100 justify-between">
                <g-btn-bs class="mb-2" height="40" background-color="#E0E0E0" onClick={selectToday}>
                  {t('onlineOrder.today')} </g-btn-bs>
                <g-btn-bs class="mb-2" height="40" background-color="#E0E0E0" onClick={selectYesterday}>
                  {t('onlineOrder.yesterday')} </g-btn-bs>
                <g-btn-bs class="mb-2" height="40" background-color="#E0E0E0" onClick={selectCurrentWeek}>
                  {t('onlineOrder.thisWeek')} </g-btn-bs>
                <g-btn-bs height="40" background-color="#E0E0E0" onClick={selectCurrentMonth}>
                  {t('onlineOrder.thisMonth')} </g-btn-bs>
              </div>
            </div>
          </>)()
          ,
          'activator': genScopeId(({ on }) =>
            <div class={['value', showMenu.value && 'value--active']} onClick={on.click}>
              {formattedRange.value} </div>
          )
        }}/>
        <div class="date-range-picker__nav right" onClick={goNext}>
          <g-icon>
            chevron_right
          </g-icon>
        </div>
      </div>
    </>)
  }
}
</script>
<style scoped lang="scss">
.date-range-picker {
  display: flex;
  align-items: center;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  cursor: pointer;
  height: 32px;

  &__nav {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #EEEEEE;
    height: 30px;

    &.left {
      border-radius: 4px 0 0 4px
    }

    &.right {
      border-radius: 0 4px 4px 0;
    }
  }

  .value {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    height: 30px;
    border-left: 1px solid #E0E0E0;
    border-right: 1px solid #E0E0E0;
    padding-left: 12px;
    padding-right: 12px;
    background: white;
    font-size: 15px;
    color: #616161;
    white-space: nowrap;

    &--active {
      background: #E3F2FD;
    }
  }

  &__active {
    border-color: #1976D2;
  }

  &__container {
    padding: 28px 16px;
    background-color: #FFF;
    border-radius: 2px;
    border: 1px solid #E0E0E0;
    position: relative;

    .g-btn-bs {
      margin: 0;
    }
  }

  &__label {
    font-size: 12px;
    color: #9E9E9E;
    margin-bottom: 8px
  }

  &__input {
    &--from, &--to {
      height: 40px;
      display: flex;
      align-items: center;
      border: 1px solid #9E9E9E;
      padding-left: 8px;
      cursor: pointer
    }

    &--from {
      border-radius: 4px 0 0 4px
    }

    &--to {
      border-left: none;
      border-radius: 0 4px 4px 0;
    }
  }

  &__date {
    font-size: 15px;
    line-height: 15px;
    margin-left: 4px;
  }
}

.arrow-top {
  position: absolute;
  top: 0;
  left: 50%;
  width: 8px;
  height: 8px;
  transform: translate(-50%, -50%) rotate(45deg);
  background-color: white;
  box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);
  z-index: -1;
}
</style>

<style lang="scss">
.g-menu--content.aw-date-range-picker-content {
  contain: layout;
  overflow: visible;
}

.date-picker-content {
  .g-picker__body {
    padding: 0 16px;

    .g-date-picker-table {
      height: auto;

      table {
        margin-bottom: 16px;

        th {
          font-size: 15px;
        }

        td {
          border: 1px solid #e4e7e7;
          height: 42px;

          button {
            cursor: pointer;
          }

          .g-table-item__content {
            font-size: 14px;
            cursor: pointer;
          }

          .g-table-item--active {
            background: #1976D2 !important;
            border-color: transparent;
            cursor: pointer;
          }
        }
      }
    }

    .g-date-picker-header {
      padding: 16px 12px 4px;
      align-items: start;

      .g-date-picker-header__prev-button {
        order: 1;
        margin: 0;
        position: relative;
        cursor: pointer;

        &::after {
          content: '\F04D';
          position: absolute;
          top: 0;
          left: 0;
          font-size: 32px;
          color: #a5a9aa;
          border: 1px solid #eaeded;
          border-radius: 2px;
        }
      }

      .g-date-picker-header__value {
        order: 2;

        & > div {
          display: flex;
          justify-content: center;

          button {
            font-size: 22px;
            color: #484848;
            padding: 0;
            line-height: 34px;
          }
        }
      }

      .g-date-picker-header__next-button {
        order: 3;
        margin: 0;
        position: relative;
        cursor: pointer;

        &::after {
          content: '\F054';
          position: absolute;
          top: 0;
          right: 0;
          font-size: 32px;
          color: #a5a9aa;
          border: 1px solid #eaeded;
          border-radius: 2px;
        }
      }
    }
  }
}
</style>
