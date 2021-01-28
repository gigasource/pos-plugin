<script>
import { internalValueFactory } from '../utils';
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n';
import { reservationSetting, getReservations, updateReservation } from './reservation-shared';
import { genScopeId } from '../utils';
import dayjs from 'dayjs'
import _ from 'lodash'
import cms from 'cms';

export default {
  props: {
    modelValue: Boolean,
    reservation: Object, // contain information about reservation: customer info (name, phone, note), reservation info (date, time, number of guests)
    edit: Boolean,       // indicate whether the dialog show in 'edit' or 'add' mode
    receivedPhone: [Number, String]
  },
  setup(props, { emit }) {
    const { t } = useI18n()
    const internalValue = internalValueFactory(props, { emit })

    // customer info
    const name = ref('')
    const phone = ref('')
    const note = ref('')

    // reservation info
    const date = ref('')
    const numberOfGuests = ref('')
    const time = ref('')

    // reference to scroll-select components
    const scrollDate = ref(null)
    const scrollNoOfGuests = ref(null)
    const scrollTime = ref(null)
    const scrollSelectHeight = computed(() => {
      if (window.innerHeight >= 600)
        return 250
      else
        return 200
    })
    const scrollSelectItemHeight = computed(() => scrollSelectItemHeight.value / 5)
    // scrollSelect items
    const list = computed(() => {
      const scrollSelectItems = {
        date: [
          t('onlineOrder.today'),
          t('onlineOrder.tomorrow')
        ],
        numberOfGuests: ['1 Guest']
      }
      if (reservationSetting.value.maxDay) {
        for (let i = 0; i < reservationSetting.value.maxDay - 2; i++) {
          scrollSelectItems.date.push(dayjs().add(i + 2, 'day').format('DD MMM'))
        }
      }
      if (reservationSetting.value.maxGuest) {
        for (let i = 0; i < reservationSetting.value.maxGuest - 1; i++) {
          scrollSelectItems.numberOfGuests.push(`${i + 2} Guests`)
        }
      }
      return scrollSelectItems
    })
    const reservations = ref([])
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const seatLimitByDay = computed(() => {
      if (!date.value)
        return []

      const list = []
      const date = getDayJsDateFromDateString(date.value)
      const day = days[date.day()]
      for (const seatLimitSetting of reservationSetting.value.seatLimit) {
        if (!seatLimitSetting.days.includes(day))
          continue

        const { startTime, endTime } = seatLimitSetting
        const availableSeats = seatLimitSetting.seat - getReservedSeatsAt({ startTime, endTime })

        list.push({
          start: startTime,
          end: endTime,
          availableSeats: availableSeats
        })
      }
      return list
    })
    const timeList = computed(() => {
      let times = []
      if (reservationSetting.value.openHours && date.value) {
        const _date = getDayJsDateFromDateString(date.value)
        const weekday = _date.day() === 0 ? 6 : _date.day() - 1
        const now = dayjs()
        _.each(reservationSetting.value.openHours, ({ dayInWeeks, openTime, closeTime }) => {
          if (dayInWeeks[weekday]) {
            const [baseHour, baseMinute] = (
                date.value === t('onlineOrder.today')
                    ? [now.hour(), now.minute()]
                    : openTime.split(':').map(Number)
            )
            let [openTimeHour, openTimeMinute] = openTime.split(':').map(Number)
            const [closeTimeHour, closeTimeMinute] = closeTime.split(':').map(Number)

            // make open minute divisible by 5
            if (openTimeMinute % 5 !== 0) {
              if (openTimeMinute > 55) {
                openTimeMinute = 0
                openTimeHour++
              } else {
                openTimeMinute = Math.round(openTimeMinute / 5) * 5
              }
            }

            // find all available time
            while (openTimeHour < closeTimeHour || (openTimeHour === closeTimeHour && openTimeMinute < closeTimeMinute)) {
              if (openTimeHour > baseHour || (openTimeHour === baseHour && openTimeMinute >= baseMinute)) {
                const time = `${_.padStart(openTimeHour, 2, '0')}:${_.padStart(openTimeMinute, 2, '0')}`
                if (!seatLimitByDay.some(limit => limit.start <= time && time <= limit.end && limit.availableSeats < (list.value.numberOfGuests.indexOf(numberOfGuests.value) + 1))) {
                  times.push(time)
                }
              }

              openTimeMinute += 5
              if (openTimeMinute >= 60) {
                openTimeMinute -= 60
                openTimeHour++
              }
            }
          }
        })
      }
      return times.sort()
    })
    /**
     * Compute total seats which has been reserved by the time range
     * @return {Number}
     */
    function getReservedSeatsAt({ startTime, endTime }) {
      return _.sumBy(_.filter(reservations.value, r => {
        const reservedTime = dayjs(r.date).format('HH:mm')
        return startTime <= reservedTime && reservedTime <= endTime
      }), r => r.noOfGuests)
    }

    //
    watch(() => date.value, async(newV) => {
      const date = getDayJsDateFromDateString(newV)
      reservations.value = await getReservations(date)
      time.value = timeList.value[0] || ''
    })
    watch(() => internalValue.value, async (newV) => {
      console.log('NewReservationDialog: internalValue', newV)
      if (!newV)
        return;

      resetData()
      const _date = getDayJsDateFromDateString(date.value)
      reservations.value = await getReservations(_date)

      if (props.edit) { // TODO: edit singleton
        name.value = props.reservation.customer.name
        phone.value = props.reservation.customer.phone
        note.value = props.reservation.note
        numberOfGuests.value = list.value.numberOfGuests[props.reservation.noOfGuests - 1]
        time.value = dayjs(props.reservation.date).format('HH:mm')
        const day = dayjs(props.reservation.date)
        if (day.isSame(dayjs(), 'day')) {
          date.value = $t('onlineOrder.today')
        } else if (day.isSame(dayjs().add(1, 'day'), 'day')) {
          date.value = $t('onlineOrder.tomorrow')
        } else {
          date.value = day.format('DD MMM') // TODO: Resolve hard-coded string
        }
      }
      if (props.receivedPhone) {
        phone.value = props.receivedPhone.toString()
      }

      setTimeout(() => {
        // TODO: review old code old code using setTimeout
        scrollDate.value.scrollToValue()
        scrollNoOfGuests.value.scrollToValue()
        scrollTime.value.scrollToValue()
      }, 100)
    })
    function resetData() {
      date.value = list.value.date[0]
      numberOfGuests.value = list.value.numberOfGuests[0]
      time.value = timeList[0] || ''
      name.value = ''
      phone.value = ''
      note.value = ''
    }

    async function createReservation(reservation) {
      const res = await ReservationModel.create(reservation)
      cms.socket.emit('scheduleNewReservation', res)
      cms.socket.emit('updateOnlineReservation', res._id, 'create')
    }

    /**
     * Return date dayjs object from date string
     * @param date "Today" | "Tomorrow" | "2020-12-31" // specified date value
     * @return {*|dayjs.Dayjs|dayjs.Dayjs}
     */
    function getDayJsDateFromDateString(date) {
      switch(date) {
        case t('onlineOrder.today'):
          return dayjs()
        case t('onlineOrder.tomorrow'):
          return dayjs().add(1, 'day')
        default:
          return dayjs(date, 'DD MMM')
      }
    }
    async function submit() {
      if (!name.value || !phone.value)
        return

      const customer = {
        name: name.value,
        phone: phone.value,
        email: props.edit ? props.reservation.customer.email : ''
      }
      const [hour, minute] = time.value.split(':').map(Number)
      const _date = dayjs().add(list.value.date.indexOf(date.value), 'day').hour(hour).minute(minute).toDate()
      const reservation = {
        noOfGuests: list.value.numberOfGuests.indexOf(numberOfGuests.value) + 1,
        date: _date,
        customer,
        note: note.value,
        status: 'pending'
      }
      if (props.edit) {
        await updateReservation(reservation._id, reservation)
        cms.socket.emit('updateOnlineReservation', reservation._id, 'update')
      } else {
        await createReservation(reservation)
      }

      internalValue.value = false
      emit('submit')
    }

    return () =>
        <g-dialog v-model={internalValue.value} fullscreen eager>
          { genScopeId(() =>
          <div class="dialog">
            <g-icon class="dialog-icon--close" onClick={() => internalValue.value = false}>icon-close</g-icon>
            <div class="dialog-content">
              <div class="dialog-content--left">
                <scroll-select ref={scrollDate} class="col-4" v-model={date.value} items={list.value.date}
                               height={scrollSelectHeight.value} itemHeight={scrollSelectItemHeight.value} selected-color="#1271FF"/>
                <scroll-select ref={scrollNoOfGuests} class="col-4" v-model={numberOfGuests.value} items={list.value.numberOfGuests}
                               height={scrollSelectHeight.value} itemHeight={scrollSelectItemHeight.value} selected-color="#1271FF"/>
                <scroll-select ref={scrollTime} class="col-4" v-model={time.value} items={timeList.value}
                               height={scrollSelectHeight.value} itemHeight={scrollSelectItemHeight.value} selected-color="#1271FF"/>
              </div>

              <div class="dialog-content--right">
                <div class="dialog-content__title">{t('onlineOrder.makeReservation')}</div>
                <div class="row-flex">
                  <g-text-field-bs class="bs-tf__pos" v-model={name.value} label="Name"
                                   placeholder={t('onlineOrder.fillText')} required key={`${internalValue.value}_name`}/>
                  <g-text-field-bs class="bs-tf__pos" v-model={phone.value} label={t('settings.tel')}
                                   placeholder={t('onlineOrder.fillNumber')} number required key={`${internalValue.value}_phone`}/>
                </div>

                <div>
                  <div class="label">{t('onlineOrder.note')}</div>
                  <g-textarea rows="3" outlined v-model={note.value} placeholder={t('onlineOrder.fillText')} no-resize/>
                </div>

                <div class="dialog-action" style="margin-right: -4px">
                  <g-btn-bs width="100" border-color="#424242" onClick={() => internalValue.value = false}>{t('onlineOrder.cancel')}</g-btn-bs>
                  <g-btn-bs width="140" background-color="#2979FF" onClick={submit}>{t('onlineOrder.submit')}</g-btn-bs>
                </div>
              </div>
            </div>
            <g-spacer/>
            <div class="dialog-keyboard">
              <pos-keyboard-full onEnterPressed={submit}/>
            </div>
          </div>)() }
        </g-dialog>
  }
}
</script>

<style scoped lang="scss">
.dialog {
  width: 100%;
  background: white;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: auto;

  &-icon--close {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 10;
  }

  &-content {
    display: flex;
    padding: 16px;

    &--left {
      display: flex;
      flex: 0 0 40%;
      padding-right: 32px;
    }

    &__title {
      font-weight: 700;
      margin-bottom: 8px;
    }

    &--right {
      flex: 1;

      .label {
        font-size: 13px;
        line-height: 16px;
        font-weight: 400;
        margin-left: 4px;
        margin-top: 16px;
      }

      .g-textarea {
        width: calc(100% - 10px);
        margin: 4px;

        ::v-deep {
          fieldset {
            border: 1px solid #ced4da;
            border-radius: 2px;
            background: #F0F0F0;

            &:focus-within {
              border: 1px solid #1471FF;
              box-shadow: 0 0 0 1px #1471FF;
              border-radius: 4px;
            }
          }

          .g-tf-append__inner {
            display: none;
          }

          .g-tf-input {
            padding: 6px 12px;
            font-size: 14px;

            &::placeholder {
              color: #9e9e9e;
              font-size: 14px;
            }
          }
        }
      }
    }
  }

  &-action {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 24px;
  }

  &-keyboard {
    padding: 16px;
    background: #BDBDBD;
  }
}

@media screen and (max-height: 599px) {
  .dialog {

    &-content {
      padding: 4px 8px;

      .bs-tf-wrapper {
        margin: 4px;

        ::v-deep .bs-tf-label {
          margin-bottom: 4px;
        }
      }

      .label {
        margin-top: 4px;
      }

      &__title {
        margin-bottom: 4px;
      }
    }

    &-action {
      display: none;
    }

    &-keyboard {
      padding: 8px;

      ::v-deep .key {
        font-size: 16px;
      }
    }
  }
}
</style>
