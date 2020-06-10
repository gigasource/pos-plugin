<template>
  <div class="reservation">
    <div class="reservation-header">
      <div class="reservation-header__day">{{formatedDay}}</div>
      <g-select text-field-component="GTextFieldBs" :items="listStatus" v-model="status"/>
      <div></div>
      <g-spacer/>
      <g-btn-bs background-color="#2979FF" icon="icon-reservation_make" @click="dialog = true">Make Reservation</g-btn-bs>
    </div>
    <div class="reservation-tab">
      <div class="reservation-tab__header">
        <div class="reservation-tab__header--left" @click="prevWeek">
          <g-icon>fas fa-long-arrow-alt-left</g-icon>
        </div>
        <div class="col-flex" v-for="(day, i) in week" :key="day.format('DD/MM/YYYY')" @click="chooseDate(day)">
          <p class="fw-700 fs-small-2">{{dayInWeeks[i]}}</p>
          <p :class="['reservation-tab__header--day', day.format('DD/MM/YYYY') === formatedDate && 'selected']">{{day.format('DD')}}</p>
        </div>
        <div class="reservation-tab__header--right" @click="nextWeek">
          <g-icon>fas fa-long-arrow-alt-right</g-icon>
        </div>
      </div>
      <div class="reservation-tab__content">
        <div v-for="(rih, index) in reservationInHours" :key="index" class="reservation-tab__content-row">
          <div class="reservation-tab__content-row--hour">
            {{rih.time}}
          </div>
          <div class="flex-grow-1">
            <div v-for="(reservation, i) in rih.reservations" :key="`${rih.time}_${i}`"
                 :class="['reservation-info', reservation.status === 'completed' && 'reservation-info--completed', reservation.status === 'pending' && 'reservation-info--pending']">
              <div class="reservation-info__time">{{reservation.date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}}</div>
              <div class="reservation-info__customer">
                <div class="reservation-info__customer--name">{{reservation.customer.name}}</div>
                <div class="reservation-info__customer--phone">{{reservation.customer.phone}}</div>
                <div v-if="reservation.note" class="reservation-info__customer--note">Note: {{reservation.note}}</div>
              </div>
              <div class="reservation-info__guest">
                Guest: <span class="fw-700 fs-small">{{reservation.noOfGuests}}</span>
              </div>
              <div class="reservation-info__action">
                <g-btn-bs width="90" :background-color="reservation.status === 'pending' ? '#757575' : '#4CAF50'" :icon="reservation.status === 'completed' && 'check'" @click="confirm(reservation)">
                  Arrived
                </g-btn-bs>
                <g-btn-bs background-color="#F9A825" icon="icon-reservation_modify@16" :disabled="reservation.status === 'completed'" @click="modify(reservation)">
                  Modify
                </g-btn-bs>
                <g-btn-bs background-color="#E57373">
                  <g-icon>icon-delete</g-icon>
                </g-btn-bs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <new-reservation-dialog v-model="dialog" :edit="edit" :reservation="selectedReservation" @submit="genReservations"/>
  </div>
</template>

<script>
  import isBetween from 'dayjs/plugin/isBetween'
  dayjs.extend(isBetween)

  export default {
    name: 'ReservationsList',
    props: {
      reservations: Array,
      reservationSetting: null,
    },
    data() {
      return {
        dialog: false,
        listStatus: [
          { text: 'All', value: 'all' },
          { text: 'Arrived', value: 'completed' },
          { text: 'Not arrived', value: 'pending' }
        ],
        status: 'all',
        date: new Date(),
        week: [],
        dayInWeeks: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        edit: false,
        selectedReservation: null
      }
    },
    created() {
      this.genWeek(this.date)
      this.$emit('getReservationSetting')
    },
    activated() {
      this.genReservations()
    },
    watch: {
      status(val) {
        this.genReservations(this.date, val)
      },
      date(val) {
        this.genReservations(val, this.status)
      },
      dialog(val) {
        if (!val) this.edit = false
      }
    },
    computed: {
      formatedDate() {
        return dayjs(this.date).format('DD/MM/YYYY')
      },
      formatedDay() {
        const day = dayjs(this.date)
        if (day.isSame(dayjs(), 'day')) {
          return 'Today'
        } else if (day.isSame(dayjs().add(1, 'day'), 'day')) {
          return 'Tomorrow'
        } else if (day.isSame(dayjs().add(-1, 'day'), 'day')) {
          return 'Yesterday'
        } else {
          return day.format('DD MMM YYYY')
        }
      },
      reservationInHours() {
        let hours = [], start = 0, end = 24
        if (this.reservationSetting) {
          if (this.reservationSetting.openTime) start = +this.reservationSetting.openTime.split(':')[0]
          if (this.reservationSetting.closeTime) end = +this.reservationSetting.closeTime.split(':')[0] + (this.reservationSetting.closeTime.split(':')[1] > 0 ? 1 : 0)
        }
        for (let i = start; i < end; i++) {
          const time = `${i < 10 ? `0${i}` : i}h`
          const hour = dayjs(this.date).hour(i).startOf('hour'),
            nextHour = dayjs(this.date).hour(i + 1).startOf('hour')
          const reservations = this.reservations ? this.reservations.filter(r => dayjs(r.date).isBetween(hour, nextHour, null, '[)')) : []
          if(this.reservationSetting && this.reservationSetting.hideEmpty) {
            if(reservations.length > 0)
              hours.push({ time, reservations: _.sortBy(reservations, r => r.date) })
          } else {
            hours.push({ time, reservations: _.sortBy(reservations, r => r.date) })
          }
        }
        return hours
      }
    },
    methods: {
      genReservations(date = this.date, status = this.status) {
        this.$emit('getReservations', date, status)
      },
      genWeek(date) {
        let week = []
        for (let i = 0; i < 7; i++) {
          week.push(dayjs(date).day(i))
        }
        this.week = week
      },
      prevWeek() {
        const date = this.week[0].add(-7, 'day').toDate()
        this.genWeek(date)
      },
      nextWeek() {
        const date = this.week[0].add(7, 'day').toDate()
        this.genWeek(date)
      },
      chooseDate(day) {
        this.date = day.toDate()
      },
      confirm(reservation) {
        if (reservation.status === 'completed') return
        this.$emit('completeReservation', reservation._id)
      },
      modify(reservation) {
        this.edit = true
        this.selectedReservation = reservation
        this.dialog = true
      },
      remove(reservation) {
        this.$emit('removeReservation', reservation._id)
      },
    }
  }
</script>

<style scoped lang="scss">
  .reservation {
    /*background-image: url('/plugins/pos-plugin/assets/out.png');*/
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
        border-top: 1px solid #9e9e9e;
        border-bottom: 1px solid #9e9e9e;

        & > div {
          flex: 1;
          align-items: center;
          justify-content: center;
          padding: 12px;
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
          }
        }
      }
    }

    &-info {
      display: flex;
      color: #424242;

      &__time,
      &__guest {
        padding: 12px;
        line-height: 1.25;
      }

      &__guest {
        font-size: 12px;
        line-height: 20px;
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
  }
</style>
