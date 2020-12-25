<template>
  <div class="reservation">
    <div class="reservation-header">
      <div class="reservation-header__day" @click="backToToday">{{$t('onlineOrder.backToday')}}</div>
      <g-select text-field-component="GTextFieldBs" :items="listStatus" v-model="status"/>
      <div></div>
      <g-spacer/>
      <g-btn-bs background-color="#2979FF" icon="icon-reservation_make" @click="makeReservation">{{$t('onlineOrder.makeReservation')}}</g-btn-bs>
    </div>
    <div class="reservation-tab">
      <div class="reservation-tab__header">
        <div class="reservation-tab__header--left" @click="prevWeek">
          <g-icon>fas fa-long-arrow-alt-left</g-icon>
        </div>
        <div class="col-flex" v-for="(day, i) in week" :key="day.date.format('DD/MM/YYYY')" @click="chooseDate(day.date)">
          <div class="reservation-notification" v-if="day.hasReservation"></div>
          <p class="fw-700 fs-small-2">{{dayInWeeks[i]}}</p>
          <p :class="['reservation-tab__header--day', day.date.format('DD/MM/YYYY') === formatedDate && 'selected']">{{day.date.format('DD')}}</p>
        </div>
        <div class="reservation-tab__header--right" @click="nextWeek">
          <g-icon>fas fa-long-arrow-alt-right</g-icon>
        </div>
      </div>
      <div class="reservation-tab__content">
        <div v-for="(rih, index) in reservationInHours" :key="index" class="reservation-tab__content-row" :id="rih.time">
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
                <img alt src="/plugins/pos-plugin/assets/guest.svg"/>
                <span class="fw-700 fs-small ml-1">{{reservation.noOfGuests}}</span>
              </div>
              <div class="reservation-info__action">
                <g-btn-bs min-width="145" :background-color="reservation.status === 'pending' ? '#757575' : '#4CAF50'" :icon="reservation.status === 'completed' && 'check'" @click="confirm(reservation)">
                  {{$t('onlineOrder.arrived')}}
                </g-btn-bs>
                <g-btn-bs background-color="#F9A825" :style="reservation.status === 'completed' && {opacity: 0.5}" @click="modify(reservation)">
                  <g-icon>icon-reservation_modify</g-icon>
                </g-btn-bs>
                <g-btn-bs background-color="#E57373" @click="remove(reservation)">
                  <g-icon>icon-delete</g-icon>
                </g-btn-bs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <new-reservation-dialog v-model="dialog.reservation" :edit="edit" :reservation="selectedReservation" @submit="genReservations"/>
    <g-dialog v-model="dialog.notice" width="338">
      <g-card>
        <g-card-title class="justify-center">
          <div class="fs-large fw-700 pt-3">Notice</div>
        </g-card-title>
        <g-card-text class="ta-center">You cannot modify a marked-as-arrived reservation.</g-card-text>
        <g-divider color="#9e9e9e" inset style="border-bottom: none"/>
        <g-card-actions style="justify-content: center">
          <g-btn-bs text-color="#536DFE" @click="dialog.notice = false">Close</g-btn-bs>
        </g-card-actions>
      </g-card>
    </g-dialog>
    <g-dialog v-model="dialog.delete" width="422">
      <g-card>
        <g-card-title><p class="fs-large-3">Delete Reservation</p></g-card-title>
        <g-card-text>
          <p class="ta-center pa-3">Are you sure you want to delete the following reservation?</p>
          <p class="fw-700 ta-center">
            <span class="mr-1">{{selectedReservation && selectedReservation.date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}}</span>
            <span class="mr-1">{{selectedReservation && selectedReservation.customer.name}}</span>
            <span class="mr-1">{{selectedReservation && selectedReservation.customer.phone}}</span>
          </p>
        </g-card-text>
        <g-card-actions class="pa-3">
          <g-btn-bs text-color="#424242" @click="dialog.delete = false">Cancel</g-btn-bs>
          <g-btn-bs width="80" background-color="#FF5252" text-color="white" @click="confirmRemove">Delete</g-btn-bs>
        </g-card-actions>
      </g-card>
    </g-dialog>
  </div>
</template>

<script>
  import isBetween from 'dayjs/plugin/isBetween'
  import { nextTick } from 'vue';
  dayjs.extend(isBetween)

  export default {
    name: 'ReservationsList',
    props: {
      reservations: Array,
      reservationSetting: null,
    },
    injectService: ['OrderStore: checkReservationDay'],
    data() {
      return {
        dialog: {
          reservation: false,
          notice: false,
          delete: false
        },
        listStatus: [
          { text: 'All', value: 'all' },
          { text: this.$t('onlineOrder.arrived'), value: 'completed' },
          { text: this.$t('onlineOrder.notArrived'), value: 'pending' }
        ],
        status: 'all',
        date: new Date(),
        week: [],
        dayInWeeks: [this.$t('onlineOrder.weekday.mon'), this.$t('onlineOrder.weekday.tue'), this.$t('onlineOrder.weekday.wed'), this.$t('onlineOrder.weekday.thu'), this.$t('onlineOrder.weekday.fri'), this.$t('onlineOrder.weekday.sat'), this.$t('onlineOrder.weekday.sun')],
        edit: false,
        selectedReservation: null
      }
    },
    async created() {
      await this.genWeek(this.date)
      this.genReservations()

      cms.socket.on('updateReservationList', async sentryTagString => {
        console.debug(sentryTagString, `3. Restaurant frontend: received 'updateReservationList', refreshing data`)
        await this.genReservations()
        await this.genWeek(this.date)
      })
    },
    mounted() {
      nextTick(() => {
        const firstReservation = _.minBy(this.reservations, r => r.date)
        if(firstReservation) {
          const hour = dayjs(firstReservation.date).format('HH')
          const row = document.getElementById(hour+'h')
          row.scrollIntoView()
        }
      })
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
      },
      reservations(val) {
        nextTick(() => {
          const firstReservation = _.minBy(val, r => r.date)
          if(firstReservation) {
            const hour = dayjs(firstReservation.date).format('HH')
            const row = document.getElementById(hour+'h')
            row.scrollIntoView()
          }
        })
      }
    },
    computed: {
      formatedDate() {
        return dayjs(this.date).format('DD/MM/YYYY')
      },
      reservationInHours() {
        let hours = [], start = 0, end = 24
        if (this.reservationSetting && this.reservationSetting.openHours) {
          const weekday = dayjs(this.date).day() === 0 ? 6 : dayjs(this.date).day() - 1
          this.reservationSetting.openHours.forEach(({dayInWeeks, closeTime, openTime}) => {
            if(dayInWeeks[weekday]) {
              if(start === 0 || +openTime.split(':')[0] < start) start = +openTime.split(':')[0]
              if(end === 24 || +closeTime.split(':')[0] > end) end = +closeTime.split(':')[0]
            }
          })
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
    emits: ['getReservations', 'updateReservation', 'getReservationSetting', 'removeReservation', 'completeReservation', 'getPendingReservationsLength'],
    methods: {
      genReservations(date = this.date, status = this.status) {
        this.$emit('getReservations', date, status)
        this.$emit('getPendingReservationsLength')
      },
      async genWeek(date) {
        let week = []
        for (let i = 1; i < 8; i++) {
          const weekday = dayjs(date).day(i)
          const hasReservation = await this.checkReservationDay(weekday.toDate())
          week.push({
            date: weekday,
            hasReservation
          })
        }
        this.week = week
      },
      async prevWeek() {
        const date = this.week[0].date.add(-7, 'day').toDate()
        await this.genWeek(date)
      },
      async nextWeek() {
        const date = this.week[0].date.add(7, 'day').toDate()
        await this.genWeek(date)
      },
      chooseDate(day) {
        this.date = day.toDate()
      },
      confirm(reservation) {
        if (reservation.status === 'completed') return
        this.$emit('completeReservation', reservation._id)
        this.$emit('getPendingReservationsLength')
      },
      modify(reservation) {
        if(reservation.status === 'completed') {
          this.dialog.notice = true
          return
        }
        this.edit = true
        this.selectedReservation = reservation
        this.dialog.reservation = true
      },
      remove(reservation) {
        this.selectedReservation = reservation
        this.dialog.delete = true
      },
      async confirmRemove(){
        this.$emit('removeReservation', this.selectedReservation._id)
        this.dialog.delete = false
        if(this.reservations.length === 1) {
          await this.genWeek(this.date)
        }
        await this.$getService('PosStore').getPendingReservationsLength()
      },
      async backToToday() {
        this.date = new Date()
        await this.genWeek(this.date)
      },
      makeReservation() {
        this.edit = false
        this.dialog.reservation = true
      }
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
