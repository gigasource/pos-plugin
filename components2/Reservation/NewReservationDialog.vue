<script>
import { internalValueFactory } from '../utils';
import { computed, ref, watch } from 'vue'
import { updateReservation, createReservation, getReservations } from '../../composition/useReservationLogic';
import { useI18n } from 'vue-i18n';

export default {
  props: {
    modelValue: Boolean,
    reservation: Object,
    edit: Boolean,
    receivedPhone: [Number, String]
  },
  setup(props, { emit }) {
    const { t } = useI18n()
    const name = ref('')
    const phone = ref('')
    const note = ref('')
    const date = ref('')
    const people = ref('')
    const time = ref('')
    const scrollDate = ref(null)
    const scrollPeople = ref(null)
    const scrollTime = ref(null)
    const list = ref({ date: [t('onlineOrder.today'), t('onlineOrder.tomorrow')], people: ['1 Guest'] })
    const reservations = ref([])
    const reservationSetting = ref(null)
    const internalValue = internalValueFactory(props, { emit })
    const timeList = computed(() => {
      let times = []
      if (reservationSetting.value && reservationSetting.value.openHours && date.value) {
        const date = date.value === t('onlineOrder.today') ? dayjs() : (date.value === t('onlineOrder.tomorrow') ? dayjs().add(1, 'day') : dayjs(date.value, 'DD MMM'))
        const weekday = date.day() === 0 ? 6 : date.day() - 1
        reservationSetting.value.openHours.forEach(({ dayInWeeks, openTime, closeTime }) => {
          if (dayInWeeks[weekday]) {
            let baseHour, baseMinute
            if (date === t('onlineOrder.today')) {
              baseHour = dayjs().hour()
              baseMinute = dayjs().minute()
            } else {
              [baseHour, baseMinute] = openTime.split(':')
            }
            let [openTimeHour, openTimeMinute] = openTime.split(':')
            let [closeTimeHour, closeTimeMinute] = closeTime.split(':')

            if (openTimeMinute % 5 !== 0) {
              if (openTimeMinute > 55) {
                openTimeMinute = 0
                openTimeHour = +openTimeHour + 1
              } else {
                openTimeMinute = Math.round(openTimeMinute / 5) * 5
              }
            }
            while (+openTimeHour < +closeTimeHour || (+openTimeHour === +closeTimeHour && +openTimeMinute < +closeTimeMinute)) {
              if (+openTimeHour > +baseHour || (+openTimeHour === +baseHour && +openTimeMinute >= +baseMinute)) {
                const time = `${openTimeHour.toString().length === 1 ? '0' + openTimeHour : openTimeHour}:${openTimeMinute.toString().length === 1 ? '0' + openTimeMinute : openTimeMinute}`
                if (!seatLimitByDay.some(limit => limit.start <= time && limit.end >= time && limit.seat < (list.people.indexOf(people) + 1))) {
                  times.push(time)
                }
              }

              openTimeMinute = +openTimeMinute + 5
              if (openTimeMinute >= 60) {
                openTimeMinute = +openTimeMinute - 60
                openTimeHour++
              }
            }
          }
        })
      }
      return times.sort()
    })
    const seatLimitByDay = computed(() => {
      let list = []
      if (date.value && reservationSetting.value) {
        // duplicate code
        const date = date.value === t('onlineOrder.today') ? dayjs() : (date.value === t('onlineOrder.tomorrow') ? dayjs().add(1, 'day') : dayjs(date.value, 'DD MMM'))
        const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.day()]
        for (const limit of reservationSetting.value.seatLimit) {
          if (limit.days.includes(day)) {
            const reservedSeat = reservations.value ? reservations.value.filter(r => dayjs(r.date).format('HH:mm') >= limit.startTime && dayjs(r.date).format('HH:mm') <= limit.endTime).reduce((acc, val) => (acc + val.noOfGuests), 0) : 0
            list.push({
              start: limit.startTime,
              end: limit.endTime,
              seat: limit.seat - reservedSeat
            })
          }
        }
      }
      return list
    })
    const height = computed(() => {
      if (window.innerHeight >= 600)
        return 250
      else
        return 200
    })

    async function submit() {
      if (!name.value || !phone.value) return
      const customer = {
        name: name.value,
        phone: phone.value,
        email: edit.value ? props.reservation.customer.email : ''
      }
      const [hour, minute] = time.value.split(':')
      const date = dayjs().add(list.value.date.indexOf(date.value), 'day').hour(+hour).minute(+minute).toDate()
      const reservation = {
        noOfGuests: list.value.people.indexOf(people.value) + 1,
        date,
        customer,
        note: note.value,
        status: 'pending'
      }
      if (edit.value) {
        await updateReservation(reservation._id, reservation)
        cms.socket.emit('updateOnlineReservation', reservation._id, 'update')
      } else {
        await createReservation(reservation)
      }

      internalValue.value = false
      emit('submit')
    }

    function resetData() {
      date.value = list.date[0]
      people.value = list.people[0]
      time.value = timeList[0] || ''
      name.value = ''
      phone.value = ''
      note.value = ''
    }
    watch(() => internalValue.value, async (newV) => {
      resetData()
      const date = date === $t('onlineOrder.today') ? dayjs().toDate() : (date === $t('onlineOrder.tomorrow') ? dayjs().add(1, 'day').toDate() : dayjs(date, 'DD MMM').toDate())
      reservations.value = await getReservations(date)
      if (newV && scrollDate.value && scrollPeople.value && scrollTime.value) {
        if (edit) {
          name.value = props.reservation.customer.name
          phone.value = props.reservation.customer.phone
          note.value = props.reservation.note
          people.value = list.people[props.reservation.noOfGuests - 1]
          time.value = dayjs(props.reservation.date).format('HH:mm')
          const day = dayjs(props.reservation.date)
          if (day.isSame(new Date(), 'day')) {
            date.value = $t('onlineOrder.today')
          } else if (day.isSame(dayjs().add(1, 'day'), 'day')) {
            date.value = $t('onlineOrder.tomorrow')
          } else {
            date.value = day.format('DD MMM')
          }
        }
        if (props.receivedPhone) {
          phone.value = props.receivedPhone.toString()
        }
        setTimeout(() => {
          scrollDate.scrollToValue()
          scrollPeople.scrollToValue()
          scrollTime.scrollToValue()
        }, 100)
      }
    })

    watch(() => date.value, async(newV) => {
      const date = val === t('onlineOrder.today') ? dayjs().toDate() : (newV === t('onlineOrder.tomorrow') ? dayjs().add(1, 'day').toDate() : dayjs(val, 'DD MMM').toDate())
      reservations.value = await getReservations(date)
      time.value = timeList.value[0] || ''
    })

    return () =>
        <g-dialog v-model={internalValue.value} fullscreen eager>
          <div class="dialog">
            <g-icon class="dialog-icon--close" onClick={() => internalValue.value = false}>
              icon-close
            </g-icon>
            <div class="dialog-content">
              <div class="dialog-content--left">
                <scroll-select ref={scrollDate} class="col-4" v-model={date.value} items={list.value.date} height={height.value} itemHeight={height.value / 5} selected-color="#1271FF">
                </scroll-select>
                <scroll-select ref={scrollPeople} class="col-4" v-model={people.value} items={list.value.people} height={height.value} itemHeight={height.value / 5} selected-color="#1271FF">
                </scroll-select>
                <scroll-select ref={scrollTime} class="col-4" v-model={time.value} items={timeList.value} height={height.value} itemHeight={height.value / 5} selected-color="#1271FF">
                </scroll-select>
              </div>
              <div class="dialog-content--right">
                <div class="dialog-content__title">
                  {t('onlineOrder.makeReservation')} </div>
                <div class="row-flex">
                  <g-text-field-bs class="bs-tf__pos" v-model={name.value} label="Name" placeholder={t('onlineOrder.fillText')} required key={`${internalValue.value}_name`}>
                  </g-text-field-bs>
                  <g-text-field-bs class="bs-tf__pos" v-model={phone.value} label={t('settings.tel')} placeholder={t('onlineOrder.fillNumber')} number required key={`${internalValue.value}_phone`}>
                  </g-text-field-bs>
                </div>
                <div>
                  <div class="label">
                    {t('onlineOrder.note')} </div>
                  <g-textarea rows="3" outlined v-model={note.value} placeholder={t('onlineOrder.fillText')} no-resize>
                  </g-textarea>
                </div>
                <div class="dialog-action" style="margin-right: -4px">
                  <g-btn-bs width="100" border-color="#424242" onClick={() => internalValue.value = false}>
                    {t('onlineOrder.cancel')} </g-btn-bs>
                  <g-btn-bs width="140" background-color="#2979FF" onClick={submit}>
                    {t('onlineOrder.submit')} </g-btn-bs>
                </div>
              </div>
            </div>
            <g-spacer>
            </g-spacer>
            <div class="dialog-keyboard">
              <pos-keyboard-full onEnterPressed={submit}>
              </pos-keyboard-full>
            </div>
          </div>
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
