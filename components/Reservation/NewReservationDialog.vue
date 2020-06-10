<template>
  <g-dialog v-model="internalValue" fullscreen>
    <div class="dialog">
      <g-icon class="dialog-icon--close" @click="internalValue = false">icon-close</g-icon>
      <div class="dialog-content">
        <div class="dialog-content--left">
          <scroll-select ref="scroll-date" class="col-4" v-model="date" :items="list.date" :height="250" :item-height="50" selected-color="#1271FF"/>
          <scroll-select ref="scroll-people" class="col-4" v-model="people" :items="list.people" :height="250" :item-height="50" selected-color="#1271FF"/>
          <scroll-select ref="scroll-time" class="col-4" v-model="time" :items="timeList" :height="250" :item-height="50" selected-color="#1271FF"/>
        </div>
        <div class="dialog-content--right">
          <div class="fw-700 mb-2">Make Reservation</div>
          <div class="row-flex">
            <pos-text-field v-model="name" label="Name" placeholder="Fill your text" required :key="`${internalValue}_name`"/>
            <pos-text-field v-model="phone" label="Phone" placeholder="Fill your number" number required :key="`${internalValue}_phone`"/>
          </div>
          <div>
            <div class="label">Note</div>
            <g-textarea rows="3" outlined v-model="note" placeholder="Fill your text" no-resize/>
          </div>
          <div class="row-flex align-center justify-end mt-4" style="margin-right: -4px">
            <g-btn-bs width="140" background-color="#2979FF" @click="submit">Submit</g-btn-bs>
          </div>
        </div>
      </div>
      <g-spacer/>
      <div class="dialog-keyboard">
        <pos-keyboard-full/>
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
          date: ['Today', 'Tomorrow'],
          people: ['1 Guest'],
        }
      }
    },
    async created() {
      await this.getReservationSetting()
      if(this.reservationSetting) {
        if(this.reservationSetting.maxDay) {
          for (let i = 0; i < this.reservationSetting.maxDay - 2; i++) {
            this.list.date.push(dayjs().add(i+2, 'day').format('DD MMM'))
          }
        }
        if(this.reservationSetting.maxGuest) {
          for (let i = 0; i < this.reservationSetting.maxGuest - 1; i++) {
            this.list.people.push(`${i + 2} Guests`)
          }
        }
      }
      this.resetData()
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
          const date = this.date === 'Today' ? dayjs() : (this.date === 'Tomorrow' ? dayjs().add(1, 'day') : dayjs(this.date, 'DD MMM'))
          const weekday = date.day() === 0 ? 6 : date.day() - 1
          this.reservationSetting.openHours.forEach(({dayInWeeks, openTime, closeTime}) => {
            if(dayInWeeks[weekday]) {
              let baseHour, baseMinute
              if(this.date === 'Today') {
                baseHour = dayjs().hour()
                baseMinute = dayjs().minute()
              } else {
                [baseHour, baseMinute] = openTime.split(':')
              }
              let [openTimeHour, openTimeMinute] = openTime.split(':')
              let [closeTimeHour, closeTimeMinute] = closeTime.split(':')

              if(openTimeMinute % 30 !== 0) {
                if(openTimeMinute > 30) {
                  openTimeMinute = 0
                  openTimeHour = +openTimeHour + 1
                } else {
                  openTimeMinute = 30
                }
              }
              while (+openTimeHour < +closeTimeHour || (+openTimeHour === +closeTimeHour && +openTimeMinute < +closeTimeMinute)) {
                if (+openTimeHour > +baseHour || (+openTimeHour === +baseHour && +openTimeMinute >= +baseMinute))
                  times.push(`${openTimeHour.toString().length === 1 ? '0' + openTimeHour : openTimeHour}:${openTimeMinute.toString().length === 1 ? '0' + openTimeMinute : openTimeMinute}`)

                openTimeMinute = +openTimeMinute + 30
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
    },
    watch: {
      internalValue(val) {
        this.resetData()
        if(val && this.$refs) {
          if(this.edit) {
            this.name = this.reservation.customer.name
            this.phone = this.reservation.customer.phone
            this.note = this.reservation.note
            this.people = this.list.people[this.reservation.noOfGuests - 1]
            this.time = dayjs(this.reservation.date).format('HH:mm')
            const day = dayjs(this.reservation.date).format('DD MMM')
            if(day === dayjs().format('DD MMM'))
              this.date = 'Today'
            else if(day === dayjs().add(1, 'day').format('DD MMM'))
              this.date = 'Tomorrow'
            else
              this.date = day
          }
          const interval = setInterval(() => {
            if(!_.isEmpty(this.$refs)) {
              this.$refs['scroll-date'].scrollToValue()
              this.$refs['scroll-people'].scrollToValue()
              this.$refs['scroll-time'].scrollToValue()
              clearInterval(interval)
            }
          }, 100)
        }
      },
      date() {
        this.time = this.timeList[0] || ''
      }
    },
    methods: {
      async submit() {
        if(!this.name || !this.phone) return
        const customer = {
          name: this.name,
          phone: this.phone,
          email: this.edit ? this.reservation.customer.email : ''
        }
        const date = new Date(dayjs().add(this.list.date.indexOf(this.date), 'day').format('MM/DD/YYYY') + ' ' + this.time)
        const reservation = {
          noOfGuests: this.list.people.indexOf(this.people) + 1,
          date,
          customer,
          note: this.note,
          status: 'pending'
        }
        if(this.edit) {
          await this.updateReservation(this.reservation._id, reservation)
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
      }
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

    &-icon--close {
      position: absolute;
      top: 16px;
      right: 16px;
    }

    &-content {
      display: flex;
      padding: 16px;

      &--left {
        display: flex;
        flex: 0 0 40%;
        padding-right: 32px;
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

    &-keyboard {
      padding: 16px;
      background: #BDBDBD;
    }
  }
</style>
