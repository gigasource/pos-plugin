<script>
import { ref, computed, onActivated, onBeforeMount, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import _ from 'lodash'
import { checkReservationDay } from '../../composition/useReservationLogic';
export default {
  props: {
    reservations: Array,
    reservationSetting: null,
  },
  setup(props, { emit } ) {
    const { t } = useI18n()
    const dialog = ref({
      reservation: false,
      notice: false,
      delete: false
    })
    const listStatus = [
      { text: 'All', value: 'all' },
      { text: t('onlineOrder.arrived'), value: 'completed' },
      { text: t('onlineOrder.notArrived'), value: 'pending' }
    ]
    const status = ref('all')
    const date = ref(new Date())
    const week = ref([])
    const dayInWeeks = [t('onlineOrder.weekday.mon'), t('onlineOrder.weekday.tue'), t('onlineOrder.weekday.wed'), t('onlineOrder.weekday.thu'), t('onlineOrder.weekday.fri'), t('onlineOrder.weekday.sat'), t('onlineOrder.weekday.sun')]
    const edit = ref(false)
    const selectedReservation = ref(null)


    const formattedDate = computed(() => {
      return dayjs(date.value).format('DD/MM/YYYY')
    })
    const reservationInHours = computed(() => {
      let hours = [], start = 0, end = 24
      if (props.reservationSetting && props.reservationSetting.openHours) {
        const weekday = dayjs(date.value).day() === 0 ? 6 : dayjs(date.value).day() - 1
        props.reservationSetting.openHours.forEach(({ dayInWeeks, closeTime, openTime }) => {
          if (dayInWeeks[weekday]) {
            if (start === 0 || +openTime.split(':')[0] < start) start = +openTime.split(':')[0]
            if (end === 24 || +closeTime.split(':')[0] > end) end = +closeTime.split(':')[0] + (+closeTime.split(':')[2] > 0 ? 1 : 0)
          }
        })
      }
      for (let i = start; i < end; i++) {
        const time = `${i < 10 ? `0${i}` : i}h`
        const hour = dayjs(date.value).hour(i).startOf('hour'),
            nextHour = dayjs(date.value).hour(i + 1).startOf('hour')
        const reservations = props.reservations ? props.reservations.filter(r => dayjs(r.date).isBetween(hour, nextHour, null, '[)')) : []
        if (props.reservationSetting && props.reservationSetting.hideEmpty) {
          if (props.reservations.length > 0)
            hours.push({ time, reservations: _.sortBy(reservations, r => r.date) })
        } else {
          hours.push({ time, reservations: _.sortBy(reservations, r => r.date) })
        }
      }
      return hours
    })

    function genReservations(date = date.value, status = status.value) {
      emit('getReservations', date, status)
      emit('getPendingReservationsLength')
    }

    async function genWeek(date) {
      let week = []
      for (let i = 1; i < 8; i++) {
        const weekday = dayjs(date).day(i)
        const hasReservation = await checkReservationDay(weekday.toDate())
        week.push({
          date: weekday,
          hasReservation
        })
      }
      week.value = week
    }

    async function prevWeek() {
      const date = week[0].date.add(-7, 'day').toDate()
      await genWeek(date)
    }

    async function nextWeek() {
      const date = week[0].date.add(7, 'day').toDate()
      await genWeek(date)
    }

    function chooseDate(day) {
      date.value = day.toDate()
    }

    function confirm(reservation) {
      if (reservation.status === 'completed') return
      emit('completeReservation', reservation._id)
      emit('getPendingReservationsLength')
    }

    function modify(reservation) {
      if (reservation.status === 'completed') {
        dialog.notice = true
        return
      }
      edit.value = true
      selectedReservation.value = reservation
      dialog.value.reservation = true
    }

    function remove(reservation) {
      selectedReservation.value = reservation
      dialog.delete = true
    }

    async function confirmRemove() {
      emit('removeReservation', selectedReservation.value._id)
      dialog.value.delete = false
      if (props.reservations.length === 1) {
        await genWeek(date.value)
      }
      await $getService('PosStore').getPendingReservationsLength()
    }

    async function backToToday() {
      date.value = new Date()
      await genWeek(date.value)
    }

    function makeReservation() {
      edit.value = false
      dialog.value.reservation = true
    }

    onActivated(() => {
      genReservations()
    })
    onBeforeMount(async () => {
      await genWeek(date.value)
      genReservations()

      cms.socket.on('updateReservationList', async sentryTagString => {
        console.debug(sentryTagString, `3. Restaurant frontend: received 'updateReservationList', refreshing data`)
        await genReservations()
        await genWeek(date.value)
      })
    })
    onMounted(() => {
      const firstReservation = _.minBy(props.reservations, r => r.date)
      if (firstReservation) {
        const hour = dayjs(firstReservation.date).format('HH')
        const row = document.getElementById(hour + 'h')
        row.scrollIntoView()
      }
    })

    watch(() => status.value, (newV) => {
      genReservations(data.value, newV)
    })
    watch(() => date.value, (newV) => {
      genReservations(newV, status.value)
    })
    watch(() => dialog.value, (newV) => {
      if (!newV) edit.value = false
    })
    watch(() => props.reservations, (newV) => {
      //todo: refactor: duplicate code with onMounted
      const firstReservation = _.minBy(newV, r => r.date)
      if (firstReservation) {
        const hour = dayjs(firstReservation.date).format('HH')
        const row = document.getElementById(hour + 'h')
        row.scrollIntoView()
      }
    })

    return () =>
        <div class="reservation">
          <div class="reservation-header">
            <div class="reservation-header__day" onClick={backToToday}>
              {t('onlineOrder.backToday')} </div>
            <g-select text-field-component="GTextFieldBs" items={listStatus} v-model={status.value}></g-select>
            <div></div>
            <g-spacer></g-spacer>
            <g-btn-bs background-color="#2979FF" icon="icon-reservation_make" onClick={makeReservation}>
              {t('onlineOrder.makeReservation')} </g-btn-bs>
          </div>
          <div class="reservation-tab">
            <div class="reservation-tab__header">
              <div class="reservation-tab__header--left" onClick={prevWeek}>
                <g-icon>
                  fas fa-long-arrow-alt-left
                </g-icon>
              </div>
              {week.value.map((day, i) =>
                  <div class="col-flex" key={day.date.format('DD/MM/YYYY')} onClick={() => chooseDate(day.date)}>
                    {
                      (day.hasReservation) &&
                      <div class="reservation-notification"></div>
                    }
                    <p class="fw-700 fs-small-2">
                      {dayInWeeks[i]} </p>
                    <p class={['reservation-tab__header--day', day.date.format('DD/MM/YYYY') === formattedDate.value && 'selected']}>
                      {day.date.format('DD')} </p>
                  </div>
              )}
              <div class="reservation-tab__header--right" onClick={nextWeek}>
                <g-icon>
                  fas fa-long-arrow-alt-right
                </g-icon>
              </div>
            </div>
            <div class="reservation-tab__content">
              {reservationInHours.value.map((rih, index) =>
                  <div key={index} class="reservation-tab__content-row" id={rih.time}>
                    <div class="reservation-tab__content-row--hour">
                      {rih.time}
                    </div>
                    <div class="flex-grow-1">
                      {rih.reservations.map((reservation, i) =>
                          <div key={`${rih.time}_${i}`} class={['reservation-info', reservation.status === 'completed' && 'reservation-info--completed', reservation.status === 'pending' && 'reservation-info--pending']}>
                            <div class="reservation-info__time">
                              {reservation.date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} </div>
                            <div class="reservation-info__customer">
                              <div class="reservation-info__customer--name">
                                {reservation.customer.name} </div>
                              <div class="reservation-info__customer--phone">
                                {reservation.customer.phone} </div>
                              {
                                (reservation.note) &&
                                <div class="reservation-info__customer--note">
                                  Note: {reservation.note} </div>
                              }
                            </div>
                            <div class="reservation-info__guest">
                              <img alt src="/plugins/pos-plugin/assets/guest.svg"> </img>
                              <span class="fw-700 fs-small ml-1">
                                {reservation.noOfGuests} </span>
                            </div>
                            <div class="reservation-info__action">
                              <g-btn-bs min-width="145" backgroundColor={reservation.status === 'pending' ? '#757575' : '#4CAF50'} icon={reservation.status === 'completed' && 'check'} onClick={() => confirm(reservation)}>

                                {t('onlineOrder.arrived')}
                              </g-btn-bs>
                              <g-btn-bs background-color="#F9A825" style={reservation.status === 'completed' && { opacity: 0.5 }} onClick={() => modify(reservation)}>
                                <g-icon>
                                  icon-reservation_modify
                                </g-icon>
                              </g-btn-bs>
                              <g-btn-bs background-color="#E57373" onClick={() => remove(reservation)}>
                                <g-icon>
                                  icon-delete
                                </g-icon>
                              </g-btn-bs>
                            </div>
                          </div>
                      )} </div>
                  </div>
              )} </div>
          </div>
          <new-reservation-dialog v-model={dialog.value.reservation} edit={edit.value} reservation={selectedReservation.value} onSubmit={genReservations}></new-reservation-dialog>
          <g-dialog v-model={dialog.value.notice} width="338">
            <g-card>
              <g-card-title class="justify-center">
                <div class="fs-large fw-700 pt-3">
                  Notice
                </div>
              </g-card-title>
              <g-card-text class="ta-center">
                You cannot modify a marked-as-arrived reservation.
              </g-card-text>
              <g-divider color="#9e9e9e" inset style="border-bottom: none"></g-divider>
              <g-card-actions style="justify-content: center">
                <g-btn-bs text-color="#536DFE" onClick={() => dialog.value.notice = false}>
                  Close
                </g-btn-bs>
              </g-card-actions>
            </g-card>
          </g-dialog>
          <g-dialog v-model={dialog.value.delete} width="422">
            <g-card>
              <g-card-title>
                <p class="fs-large-3">
                  Delete Reservation </p>
              </g-card-title>
              <g-card-text>
                <p class="ta-center pa-3">
                  Are you sure you want to delete the following reservation? </p>
                <p class="fw-700 ta-center">
                  <span class="mr-1">
                    {selectedReservation.value && selectedReservation.value.date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} </span>
                  <span class="mr-1">
                    {selectedReservation.value && selectedReservation.value.customer.name} </span>
                  <span class="mr-1">
                    {selectedReservation.value && selectedReservation.value.customer.phone} </span>
                </p>
              </g-card-text>
              <g-card-actions class="pa-3">
                <g-btn-bs text-color="#424242" onClick={() => dialog.value.delete = false}>
                  Cancel
                </g-btn-bs>
                <g-btn-bs width="80" background-color="#FF5252" text-color="white" onClick={confirmRemove}>
                  Delete
                </g-btn-bs>
              </g-card-actions>
            </g-card>
          </g-dialog>
        </div>
  }
}
</script>

<style scoped lang="scss">
.reservation {
  background-image: url('/plugins/pos-plugin/assets/out.png');
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding-top: 16px;

  &-header {
    display: flex;
    align-items: center;

    &__day {
      background: white;
      box-shadow: 2px 0px 5px rgba(0, 0, 0, 0.1398);
      border-radius: 6px;
      padding: 6px 12px;
      margin: 4px 5px 8px;
      cursor: pointer;
    }

    .g-select {
      min-width: 115px;

      ::v-deep .bs-tf-wrapper {
        background: white;
        box-shadow: 2px 0px 5px rgba(0, 0, 0, 0.1398);
        border-radius: 6px;

        .bs-tf-input-group {
          border-color: transparent;
        }
      }
    }
  }

  &-tab {
    height: calc(100% - 50px);
    overflow: hidden;

    &__header {
      display: flex;
      width: 100%;
      background: #FFFFFF;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1398);

      & > div {
        flex: 1;
        align-items: center;
        justify-content: center;
        padding: 6px 9px;
        color: #424242;
      }

      &--left, &--right {
        display: flex;
        flex: 0 0 54px !important;
      }

      &--left {
        border-right: 1px solid #9e9e9e;
      }

      &--right {
        border-left: 1px solid #9e9e9e;
      }

      &--day {
        width: 33px;
        height: 33px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 8px;

        &.selected {
          background: #046EFF;
          color: white;
        }
      }
    }

    &__content {
      max-height: calc(100% - 80px);
      overflow: auto;

      &-row {
        display: flex;
        border-bottom: 1px solid #9e9e9e;

        &--hour {
          padding: 12px;
          border-right: 1px solid #9e9e9e;
          width: 54px;
          min-width: 54px;
        }
      }
    }
  }

  &-info {
    display: flex;
    color: #424242;

    &__time {
      padding: 12px;
      line-height: 1.25;
    }

    &__guest {
      font-size: 12px;
      padding: 12px;
      display: flex;
      align-items: center;
      margin-right: 50px;
    }

    &__customer {
      padding: 12px;
      flex: 1;
      font-size: 15px;
      line-height: 1.25;

      &--name, &--phone {
        font-weight: 700;
      }

      &--note {
        font-size: 12px;
        font-weight: 400;
        margin-top: 8px;
      }
    }

    &__action {
      padding: 0 12px;
      display: flex;
      align-items: center;

      .g-btn-bs {
        font-size: 14px;
        margin: 0 4px;
      }
    }

    &--completed {
      background: #FFECB3;

      &:not(:last-child) {
        border-bottom: 1px solid #E6D39A;
      }
    }

    &--pending {
      background: #E0E0E0;

      &:not(:last-child) {
        border-bottom: 1px solid #C7C7C7;
      }
    }
  }

  &-notification {
    width: 4px;
    height: 4px;
    background: #FF4452;
    border-radius: 50%;
  }
}
</style>
