<template>
  <g-dialog v-model="internalValue" fullscreen eager>
    <div class="dialog">
      <g-icon class="dialog-icon--close" @click="internalValue = false">icon-close</g-icon>
      <div class="dialog-content">
        <div class="dialog-content--left">
          <scroll-select ref="scroll-date" class="col-4" v-model="date" :items="list.date" :height="height" :item-height="height/5" selected-color="#1271FF"/>
          <scroll-select ref="scroll-people" class="col-4" v-model="people" :items="list.people" :height="height" :item-height="height/5" selected-color="#1271FF"/>
          <scroll-select ref="scroll-time" class="col-4" v-model="time" :items="timeList" :height="height" :item-height="height/5" selected-color="#1271FF"/>
        </div>
        <div class="dialog-content--right">
          <div class="dialog-content__title">{{$t('onlineOrder.makeReservation')}}</div>
          <div class="row-flex">
            <pos-text-field v-model="name" label="Name" :placeholder="$t('onlineOrder.fillText')" required :key="`${internalValue}_name`"/>
            <pos-text-field v-model="phone" :label="$t('settings.tel')" :placeholder="$t('onlineOrder.fillNumber')" number required :key="`${internalValue}_phone`"/>
          </div>
          <div>
            <div class="label">{{$t('onlineOrder.note')}}</div>
            <g-textarea rows="3" outlined v-model="note" :placeholder="$t('onlineOrder.fillText')" no-resize/>
          </div>
          <div class="dialog-action" style="margin-right: -4px">
            <g-btn-bs width="100" border-color="#424242" @click="internalValue = false">{{$t('onlineOrder.cancel')}}</g-btn-bs>
            <g-btn-bs width="140" background-color="#2979FF" @click="submit">{{$t('onlineOrder.submit')}}</g-btn-bs>
          </div>
        </div>
      </div>
      <g-spacer/>
      <div class="dialog-keyboard">
        <pos-keyboard-full @enter-pressed="submit"/>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: 'NewReservationDialog',
    props: {
      value: Boolean,
      reservation: Object,
      edit: Boolean,
      receivedPhone: [Number, String]
    },
    injectService: ['SettingsStore:(reservationSetting, getReservationSetting)', 'OrderStore:(createReservation, updateReservation)'],
    data() {
      return {
        name: '',
        phone: '',
        note: '',
        date: '',
        people: '',
        time: '',
        list: {
          date: [$t('onlineOrder.today'), $t('onlineOrder.tomorrow')],
          people: ['1 Guest'],
        },
        reservations: []
      }
    },
    async created() {
      await this.getReservationSetting()
      if (this.reservationSetting) {
        if (this.reservationSetting.maxDay) {
          for (let i = 0; i < this.reservationSetting.maxDay - 2; i++) {
            this.list.date.push(dayjs().add(i + 2, 'day').format('DD MMM'))
          }
        }
        if (this.reservationSetting.maxGuest) {
          for (let i = 0; i < this.reservationSetting.maxGuest - 1; i++) {
            this.list.people.push(`${i + 2} Guests`)
          }
        }
      }
      this.resetData()
      this.reservations = await this.getReservations()
    },
    computed: {
      internalValue: {
        get() {
          return this.value;
        },
        set(val) {
          this.$emit('input', val)
        }
      },
      timeList() {
        let times = []

        if(this.reservationSetting && this.reservationSetting.openHours && this.date) {
          const date = this.date === $t('onlineOrder.today') ? dayjs() : (this.date === $t('onlineOrder.tomorrow') ? dayjs().add(1, 'day') : dayjs(this.date, 'DD MMM'))
          const weekday = date.day() === 0 ? 6 : date.day() - 1
          this.reservationSetting.openHours.forEach(({dayInWeeks, openTime, closeTime}) => {
            if(dayInWeeks[weekday]) {
              let baseHour, baseMinute
              if(this.date === $t('onlineOrder.today')) {
                baseHour = dayjs().hour()
                baseMinute = dayjs().minute()
              } else {
                [baseHour, baseMinute] = openTime.split(':')
              }
              let [openTimeHour, openTimeMinute] = openTime.split(':')
              let [closeTimeHour, closeTimeMinute] = closeTime.split(':')

              if(openTimeMinute % 5 !== 0) {
                if(openTimeMinute > 55) {
                  openTimeMinute = 0
                  openTimeHour = +openTimeHour + 1
                } else {
                  openTimeMinute = Math.round(openTimeMinute/5) * 5
                }
              }
              while (+openTimeHour < +closeTimeHour || (+openTimeHour === +closeTimeHour && +openTimeMinute < +closeTimeMinute)) {
                if (+openTimeHour > +baseHour || (+openTimeHour === +baseHour && +openTimeMinute >= +baseMinute)) {
                  const time = `${openTimeHour.toString().length === 1 ? '0' + openTimeHour : openTimeHour}:${openTimeMinute.toString().length === 1 ? '0' + openTimeMinute : openTimeMinute}`
                  if(!this.seatLimitByDay.some(limit => limit.start <= time && limit.end >= time && limit.seat < (this.list.people.indexOf(this.people) + 1))) {
                    times.push(time)
                  }
                }

                openTimeMinute = +openTimeMinute + 5
                if(openTimeMinute >= 60) {
                  openTimeMinute = +openTimeMinute - 60
                  openTimeHour++
                }
              }
            }
          })
        }
        return times.sort()
      },
      seatLimitByDay() {
        let list = []
        if(this.date && this.reservationSetting) {
          const date = this.date === $t('onlineOrder.today') ? dayjs() : (this.date === $t('onlineOrder.tomorrow') ? dayjs().add(1, 'day') : dayjs(this.date, 'DD MMM'))
          const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.day()]
          for(const limit of this.reservationSetting.seatLimit) {
            if(limit.days.includes(day)) {
              const reservedSeat = this.reservations ? this.reservations.filter(r => dayjs(r.date).format('HH:mm') >= limit.startTime && dayjs(r.date).format('HH:mm') <= limit.endTime).reduce((acc, val) => (acc + val.noOfGuests), 0) : 0
              list.push({
                start: limit.startTime,
                end: limit.endTime,
                seat: limit.seat - reservedSeat
              })
            }
          }
        }
        return list
      },
      height() {
        if(window.innerHeight >= 600)
          return 250
        else
          return 200
      }
    },
    watch: {
      async internalValue(val) {
        this.resetData()
        const date = this.date === $t('onlineOrder.today') ? dayjs().toDate() : (this.date === $t('onlineOrder.tomorrow') ? dayjs().add(1, 'day').toDate() : dayjs(this.date, 'DD MMM').toDate())
        this.reservations = await this.getReservations(date)
        if (val && this.$refs) {
          if (this.edit) {
            this.name = this.reservation.customer.name
            this.phone = this.reservation.customer.phone
            this.note = this.reservation.note
            this.people = this.list.people[this.reservation.noOfGuests - 1]
            this.time = dayjs(this.reservation.date).format('HH:mm')
            const day = dayjs(this.reservation.date)
            if (day.isSame(new Date(), 'day')) {
              this.date = $t('onlineOrder.today')
            } else if (day.isSame(dayjs().add(1, 'day'), 'day')) {
              this.date = $t('onlineOrder.tomorrow')
            } else {
              this.date = day.format('DD MMM')
            }
          }
          if(this.receivedPhone) {
            this.phone = this.receivedPhone.toString()
          }
          const interval = setInterval(() => {
            if (!_.isEmpty(this.$refs)) {
              this.$refs['scroll-date'].scrollToValue()
              this.$refs['scroll-people'].scrollToValue()
              this.$refs['scroll-time'].scrollToValue()
              clearInterval(interval)
            }
          }, 100)
        }
      },
      async date(val) {
        const date = val === $t('onlineOrder.today') ? dayjs().toDate() : (val === $t('onlineOrder.tomorrow') ? dayjs().add(1, 'day').toDate() : dayjs(val, 'DD MMM').toDate())
        this.reservations = await this.getReservations(date)
        this.time = this.timeList[0] || ''
      }
    },
    methods: {
      async submit() {
        if (!this.name || !this.phone) return
        const customer = {
          name: this.name,
          phone: this.phone,
          email: this.edit ? this.reservation.customer.email : ''
        }
        const [hour, minute] = this.time.split(':')
        const date = dayjs().add(this.list.date.indexOf(this.date), 'day').hour(+hour).minute(+minute).toDate()
        const reservation = {
          noOfGuests: this.list.people.indexOf(this.people) + 1,
          date,
          customer,
          note: this.note,
          status: 'pending'
        }
        if (this.edit) {
          await this.updateReservation(this.reservation._id, reservation)
          cms.socket.emit('updateOnlineReservation', this.reservation._id, 'update')
        } else {
          await this.createReservation(reservation)
        }

        this.internalValue = false
        this.$emit('submit')
      },
      resetData() {
        this.date = this.list.date[0]
        this.people = this.list.people[0]
        this.time = this.timeList[0] || ''
        this.name = ''
        this.phone = ''
        this.note = ''
      },
      async getReservations(date = new Date(), status = 'all') {
        const dateTo = dayjs(date).startOf('day').add(1, 'day').toDate(),
            dateFrom = dayjs(date).startOf('day').toDate()
        return await cms.getModel('Reservation').find({
          status: (status === 'all' ? { $in: ['pending', 'completed'] } : status),
          date: { $gte: dateFrom, $lt: dateTo }
        })
      },
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
