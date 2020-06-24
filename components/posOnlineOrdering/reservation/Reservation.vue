<template>
  <div class="reservation elevation-2 r">
    <div @click="close" class="abs" style="top: 10px; right: 10px; width: 20px; height: 20px; cursor: pointer; z-index: 10">
      <img src="/plugins/pos-plugin/assets/close.svg" draggable="false"/>
    </div>

    <template v-if="mode === 'reservation'">
      <div class="reservation-header">
        <img v-if="image" alt :src="image" class="reservation-header__logo">
        <div class="reservation-header__title">Table Reservation</div>
        <div class="reservation-header__stepper">
          <div class="reservation-header__stepper-step" @click="changeStep(1)">
            <div>
              <g-badge :value="!!people" overlay color="#4385F5" badge-size="16" nudge-top="-4" nudge-right="-4">
                <template v-slot:badge>
                  <g-icon color="white" size="8">check</g-icon>
                </template>
                <div :class="['step-icon', (step === 1 || people) && 'step-icon--selected']">
                  <g-icon>icon-reservation_people</g-icon>
                </div>
              </g-badge>
            </div>
            <p :class="['step-label', step === 1 && 'step-label--choosing', people && 'step-label--selected']">{{peopleLabel}}</p>
          </div>
          <div class="reservation-header__stepper-divider"></div>
          <div class="reservation-header__stepper-step" @click="changeStep(2)">
            <div>
              <g-badge :value="!!date" overlay color="#4385F5" badge-size="16" nudge-top="-4" nudge-right="-4">
                <template v-slot:badge>
                  <g-icon color="white" size="8">check</g-icon>
                </template>
                <div :class="['step-icon', (step === 2 || date) && 'step-icon--selected']">
                  <g-icon>icon-reservation_date</g-icon>
                </div>
              </g-badge>
            </div>
            <p :class="['step-label', step === 2 && 'step-label--choosing', date && 'step-label--selected']">{{dateLabel}}</p>
          </div>
          <div class="reservation-header__stepper-divider"></div>
          <div class="reservation-header__stepper-step" @click="changeStep(3)">
            <div>
              <g-badge :value="!!time" overlay color="#4385F5" badge-size="16" nudge-top="-4" nudge-right="-4">
                <template v-slot:badge>
                  <g-icon color="white" size="8">check</g-icon>
                </template>
                <div :class="['step-icon', (step === 3 || time) && 'step-icon--selected']">
                  <g-icon>icon-reservation_time</g-icon>
                </div>
              </g-badge>
            </div>
            <p :class="['step-label', step === 3 && 'step-label--choosing', time && 'step-label--selected']">{{timeLabel}}</p>
          </div>
          <div class="reservation-header__stepper-divider"></div>
          <div class="reservation-header__stepper-step" @click="changeStep(4)">
            <div :class="['step-icon', step === 4 && 'step-icon--selected']">
              <g-icon>icon-reservation_complete</g-icon>
            </div>
            <p :class="['step-label', step === 4 && 'step-label--choosing']">Complete</p>
          </div>
        </div>
      </div>
      <div class="reservation-content">
        <template v-if="step === 1 || step === 2">
          <div class="reservation-content__title">People</div>
          <div class="row-flex align-items-center" style="margin-left: -8px; margin-bottom: 32px">
            <div :class="['btn-people', people === 1 && 'btn-people--selected']" @click="choosePeople(1)">1</div>
            <div :class="['btn-people', people === 2 && 'btn-people--selected']" @click="choosePeople(2)">2</div>
            <div :class="['btn-people', people === 3 && 'btn-people--selected']" @click="choosePeople(3)">3</div>
            <div :class="['btn-people', people === 4 && 'btn-people--selected']" @click="choosePeople(4)">4</div>
            <g-select :class="['select-people', people === peopleSelected && peopleSelected !== 0 && 'selected']" :key="`people_${people}`" text-field-component="GTextFieldBs" v-model="peopleSelected" :items="peopleList" @input="choosePeople(peopleSelected, false)"/>
          </div>
          <div class="reservation-content__title">Date</div>
          <g-date-picker :min="today" :max="maxDay" no-title :disabled="people === 0" v-model="date" @input="chooseDate" :class="errorDate && 'error-picker'"/>
          <div v-if="errorDate" class="error-message">{{errorDate}}</div>
        </template>
        <template v-if="step === 3">
          <div class="reservation-content__title--large">Select time for {{dateOrdinal}}</div>
          <div class="reservation-content__title">Time</div>
          <div class="reservation-content__time">
            <div v-for="(t, i) in timeList" :key="i" :class="['reservation-content__time-item', time === t && 'reservation-content__time-item--selected']" @click="setTime(t)">
              {{t}}
            </div>
          </div>
          <div class="reservation-content__time-message">
            If your preferred time is not available please contact us on: <b><u>{{store.phone}}</u></b>
          </div>
        </template>
        <template v-if="step === 4">
          <div class="reservation-content__title--large">Complete your reservation as a guest</div>
          <div class="reservation-content__title">Information</div>
          <g-text-field-bs :rules="rules.first" v-model="customer.firstName" @input="rules.first = []" placeholder="First Name*" required/>
          <g-text-field-bs :rules="rules.last" v-model="customer.lastName" @input="rules.last = []" placeholder="Last Name*" required/>
          <g-text-field-bs v-model="customer.email" placeholder="Email"/>
          <g-text-field-bs :class="rules.phone && 'phone-error'" :rules="validatePhone" validate-on-blur type="number" v-model="customer.phone" @input="rules.phone = false" placeholder="Phone Number*" required/>
          <div class="reservation-content__title mt-4">Note</div>
          <g-textarea no-resize rows="3" v-model="customer.note"/>
          <g-btn-bs :disabled="unavailableComplete" class="reservation-btn" @click="completeReservation">Complete</g-btn-bs>
        </template>
      </div>
    </template>
    <template v-if="mode === 'completed'">
      <div class="reservation--completed">
        <div class="reservation-img">
          <img alt src="/plugins/pos-plugin/assets/reservation_done.svg"/>
        </div>
        <div class="reservation-header__title mb-5">Reservation Complete</div>
        <div class="reservation-content__title mt-3 mb-1">Order Information</div>
        <div class="reservation-info--order">
          <p>{{dateLabel}}. {{timeLabel}}</p>
          <p>{{peopleLabel}}. {{customer.note && `"${customer.note}"`}}</p>
        </div>
        <div class="reservation-content__title mt-3 mb-1">Customer Information</div>
        <div class="reservation-info--customer">
          <p>{{customer.firstName}} {{customer.lastName}}</p>
          <p v-if="customer.email">{{customer.email}}</p>
          <p>{{customer.phone}}</p>
        </div>
        <div class="reservation-notice">
          <g-icon color="#64C186" class="mr-3">info_outline</g-icon>
          <div>Tell your name to our staff. <br>You will be invited to a table.</div>
        </div>
        <g-spacer/>
        <g-btn-bs class="reservation-btn mt-5" @click="clearData">New Reservation</g-btn-bs>
      </div>
    </template>

    <g-dialog v-model="dialog.notice" persistent>
      <div class="dialog-notice">
        <div class="dialog-notice__title">Notice</div>
        <div class="dialog-notice__message">The restaurant does not accept reservation request at the moment. Please try again later!</div>
        <g-btn-bs text-color="indigo accent-2" @click="dialog.notice = false">Close</g-btn-bs>
      </div>
    </g-dialog>
  </div>
</template>

<script>
  import {incrementTime} from "../../logic/timeUtil";

  export default {
    name: "Reservation",
    data() {
      return {
        mode: 'reservation',
        step: 1,
        people: 0,
        peopleList: [{text: 'Select', value: 0}],
        peopleSelected: 0,
        date: '',
        time: '',
        today: '',
        maxDay: '',
        store: {
          phone: '',
          openHours: [
            {
              openTime: '06:00',
              closeTime: '23:30',
              dayInWeeks: [true, true, true, true, true, true, true]
            }
          ]
        },
        errorDate: '',
        customer: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          note: ''
        },
        rules: {
          first: [],
          last: [],
          phone: false
        },
        dialog: {
          notice: false
        },
        noRequest: false,
        locale: String,
        image: null,
      }
    },
    async created() {
      this.today = dayjs().format('YYYY-MM-DD')
      const storeIdOrAlias = this.$route.params.storeIdOrAlias
      let maxGuest = 40
      if(storeIdOrAlias) {
        const store = await cms.getModel('Store').findOne({alias: storeIdOrAlias})
        if(store) this.store = store
        if(store.reservationSetting) {
          maxGuest = store.reservationSetting.maxGuest || 40
          if(store.reservationSetting.maxDay) {
            this.maxDay = dayjs(new Date).add(store.reservationSetting.maxDay - 1, 'day').format('YYYY-MM-DD')
          }
          if(!store.reservationSetting.activeReservation) {
            this.dialog.notice = true
            this.noRequest = true
          }
          if(store.country) {
            this.locale = store.country.locale
            root.$i18n.locale = store.country.locale || 'en'
          }
        }
        this.image = store.logoImageSrc
      }
      for(let i = 5; i <= maxGuest; i++) {
        this.peopleList.push({text: i, value: i})
      }
    },
    computed: {
      peopleLabel() {
        if (this.people > 1) {
          return this.people + ' people'
        } else if (this.people === 1) {
          return '1 person'
        } else
          return 'Select person'
      },
      dateLabel() {
        if (this.date) {
          return dayjs(this.date).format('DD-MMM-YYYY')
        } else
          return 'Select date'
      },
      dateOrdinal() {
        if(this.date) {
          const month = dayjs(this.date).format('MMMM'), date = dayjs(this.date).date()
          switch (date % 10) {
            case 1:  return date === 11 ? `${month} 11th` : `${month} ${date}st`;
            case 2:  return date === 12 ? `${month} 12th` : `${month} ${date}nd`;
            case 3:  return date === 13 ? `${month} 13th` : `${month} ${date}rd`;
            default: return `${month} ${date}th`;
          }
        }
        return 'your reservation'
      },
      timeLabel() {
        if (this.time) {
          return this.time
        } else
          return 'Select time'
      },
      timeList() {
        let times = []

        if(this.store.openHours && this.date) {
          const weekday = dayjs(this.date).day() === 0 ? 6 : dayjs(this.date).day() - 1
          this.store.openHours.forEach(({dayInWeeks, openTime, closeTime}) => {
            if(dayInWeeks[weekday]) {
              let baseHour, baseMinute
              if(this.today === this.date) {
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

                const newTime = incrementTime(+openTimeHour, +openTimeMinute, 30)
                openTimeHour = newTime.hour
                openTimeMinute = newTime.minute
              }
            }
          })
        }
        return times.sort()
      },
      unavailableComplete() {
        if(this.noRequest) return true
        return this.people === 0 || !this.date || !this.time;
      },
      validatePhone() {
        let rules = []
        const phoneRegex = this.$t('common.phoneRegex') && new RegExp(this.$t('common.phoneRegex'))
        if(this.locale === 'de-DE' || this.locale === 'de' && phoneRegex) {
          rules.push(val => (phoneRegex.test(val) || 'Invalid phone number!'))
        }
        return rules
      }
    },
    methods: {
      changeStep(step) {
        this.step = step
      },
      choosePeople(number, updateSelect = true) {
        this.people = number
        if(updateSelect) this.peopleSelected = 0
        if(number === 0)
          this.changeStep(1)
        else
          this.changeStep(2)
      },
      chooseDate(date) {
        let err = true
        const weekday = dayjs(date).day() === 0 ? 6 : dayjs(date).day() - 1
        this.store.openHours.forEach(({dayInWeeks}) => {
          if(dayInWeeks[weekday]) {
            err = false
          }
        })
        if(err)
          this.errorDate = 'Restaurant is closed on the selected date!'
        else {
          this.changeStep(3)
          this.errorDate = ''
        }
      },
      setTime(time) {
        this.time = time
        this.changeStep(4)
      },
      sendReservation() {
        const reservationData = {
          noOfGuests: this.people,
          date: this.date,
          time: this.time,
          customer: {
            name: `${this.customer.firstName} ${this.customer.lastName}`,
            firstName: this.customer.firstName,
            lastName: this.customer.lastName,
            email: this.customer.email,
            phone: this.customer.phone
          },
          note: this.customer.note
        }

        cms.socket.emit('createReservation', this.store._id, reservationData)
        console.debug(`sentry:eventType=reservation,store=${this.store.name},alias=${this.store.alias}`,
          `1. Online order frontend: received reservation:
          guests:${reservationData.noOfGuests};date:${reservationData.date};time:${reservationData.time};
          customer:${reservationData.customer.name || 'no name'},${reservationData.customer.email || 'no email'},${reservationData.phone || 'no phone'};
          note:${reservationData.note}`)
      },
      completeReservation() {
        let err = false
        if(!this.customer.firstName) {
          this.rules.first.push(() => ' ')
          err = true
        }
        if(!this.customer.lastName) {
          this.rules.last.push(() => ' ')
          err = true
        }
        if(!this.customer.phone || isNaN(this.customer.phone)) {
          this.rules.phone = true
          err = true
        }
        if(err) return
        this.sendReservation()
        this.mode = 'completed'
      },
      clearData() {
        this.people = 0
        this.date = ''
        this.time = ''
        this.customer = {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          note: ''
        }
        this.step = 1
        this.mode = 'reservation'
      },
      close() {
        window.parent.postMessage('close-iframe', '*')
      }
    }
  }
</script>

<style scoped lang="scss">
  .reservation {
    width: 100%;
    max-width: 410px;
    background: white;
    margin-left: auto;
    margin-right: auto;

    &-header {
      background: #F0F4F7;
      padding: 20px;
      position: relative;
      border-bottom: 0.5px solid #CAD3DF;

      &__icon--close {
        position: absolute;
        top: 20px;
        right: 20px;
        cursor: pointer;
      }

      &__title {
        margin-top: 12px;
        margin-bottom: 36px;
        font-size: 20px;
        line-height: 25px;
        font-weight: 700;
        text-align: center;
        color: #212B36;
      }

      &__stepper {
        display: flex;
        align-items: center;
        padding-bottom: 24px;
        margin-bottom: 16px;
        margin-left: 24px;
        margin-right: 24px;

        &-step {
          position: relative;
          cursor: pointer;

          .step-icon {
            width: 44px;
            height: 44px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;

            &--selected {
              background: #FFFFFF;
              box-shadow: 1px 1px 10px rgba(67, 133, 245, 0.17);
            }
          }

          .step-label {
            position: absolute;
            top: 50px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 13px;
            color: #454F5B;
            white-space: nowrap;

            &--choosing {
              font-weight: 700;
            }

            &--selected {
              font-weight: 700;
              color: #4385F5;
            }
          }

          @media screen and (max-width: 370px) {
            .step-label {
              white-space: unset;
              text-align: center;
            }
          }
        }

        &-divider {
          height: 1px;
          flex-grow: 1;
          margin: 0 6px;
          background-image: linear-gradient(to right, #8A8F97 50%, transparent 50%);
          background-size: 8px 1px;
        }
      }

      &__logo {
        max-width: 80px;
        margin-left: 50%;
        transform: translateX(-50%);
      }
    }

    &-content {
      padding: 24px;

      &__title {
        font-size: 15px;
        font-weight: 700;
        color: #212B36;
        margin-bottom: 16px;

        &--large {
          font-size: 18px;
          font-weight: 700;
          text-align: center;
          margin-bottom: 24px;
        }
      }

      &__people {
        font-size: 15px;
        color: #212B36;
        flex-basis: 24px;
        text-align: center;
      }

      .g-picker {
        box-shadow: none;
        width: 100%;

        ::v-deep {
          .g-date-picker-header {
            justify-content: center;
            margin-bottom: 16px;

            &__value {
              order: 2;
              flex: 0 0 auto;
              pointer-events: none;

              button {
                padding: 0;
                font-size: 15px;
                line-height: 19px;
                color: #212B36;
                font-family: Muli, sans-serif;
                pointer-events: none;
              }
            }

            &__prev-button {
              order: 1;
              margin-right: 0;
            }

            &__next-button {
              order: 3;
            }

            &__prev-button, &__next-button {
              cursor: pointer;
              position: relative;

              &:after {
                font-size: 24px;
                position: absolute;
                top: 0;
                left: 0;
              }
            }
          }

          .g-picker__body {
            width: 100% !important;
          }

          .g-date-picker-table {
            padding: 0;
            height: auto;

            th {
              font-size: 14px;
            }

            @media screen and (min-width: 410px) {
              .g-table-item {
                width: 45px;
                height: 45px;
              }
            }
            .g-table-item {
              cursor: pointer;

              &:hover {
                border: 1px solid black;
              }

              &__content {
                font-size: 15px;
                white-space: nowrap;
              }

              &--active {
                background: #4385F5 !important;
                border-color: #4385F5 !important;
              }
            }
          }
        }

        &.error-picker ::v-deep .g-date-picker-table .g-table-item--active {
          background: #ff4452 !important;
          border-color: #ff4452 !important;
        }
      }

      &__time {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        grid-auto-rows: 42px;
        grid-gap: 12px 20px;
        overflow: auto;
        max-height: 340px;
        scrollbar-width: none; // firefox
        -ms-overflow-style: none; //edge

        &::-webkit-scrollbar {
          display: none;
        }

        &-item {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F6F7FB;
          border-radius: 4px;
          cursor: pointer;
          font-size: 15px;
          position: relative;

          &:before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 4px;
          }

          &:hover:before {
            background: rgba(0, 0, 0, 0.08);
          }

          &--selected {
            background: #4385F5;
            color: white;
          }
        }

        &-message {
          font-size: 15px;
          text-align: center;
          padding: 16px;
        }
      }

      .bs-tf-wrapper {
        width: 100%;
        margin: 8px 0;
      }

      .g-textarea {
        background: #F6F7FB;
        border-radius: 4px;

        ::v-deep {
          .g-tf {
            &:before, &:after {
              display: none;
            }
          }

          textarea {
            padding-left: 6px;
          }
        }
      }

      .select-people {
        min-width: 110px;
        margin-left: 8px;

        ::v-deep {
          .bs-tf-wrapper {
            margin: 0;
            background: #f5f5f5;
            border-radius: 4px;

            .bs-tf-input-group {
              border-color: transparent !important;

              .bs-tf-inner-input-group {
                height: 40px;
              }
            }
          }
        }

        &.selected {
          ::v-deep {
            .bs-tf-wrapper {
              background: #1271FF;

              .bs-tf-append-inner .g-icon,
              .input {
                color: white;
              }
            }
          }
        }
      }
    }

    &-btn {
      width: 100%;
      height: 50px;
      background: #4385F5;
      color: white;
      border-radius: 4px;
      margin: 0;
    }

    &--completed {
      padding: 36px;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    &-img {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 70px;
      margin-bottom: 8px;
    }

    &-info {
      &--order {
        font-weight: 500;
        font-size: 15px;
        color: #4385F5;
      }

      &--customer {
        font-weight: 500;
        font-size: 15px;
        color: #454F5B;
      }
    }

    &-notice {
      display: flex;
      align-items: center;
      padding: 8px 36px 8px 16px;
      background: #F0FAF3;
      color: #64C186;
      font-weight: 500;
      font-size: 15px;
      margin-top: 24px;
    }

    .error-message {
      font-size: 12px;
      font-style: italic;
      color: #ff4452;
    }

    .btn-people {
      width: 40px;
      height: 40px;
      min-width: 36px;
      border-radius: 4px;
      background: #f5f5f5;
      margin-left: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      &--selected {
        background: #1271FF;
        color: #FFFFFF;
      }
    }

    .phone-error ::v-deep .bs-tf-inner-input-group {
      border-color: red !important;
      box-shadow: 0 0 0 3px rgba(255, 68, 82, 0.25) !important;
    }
  }

  .dialog-notice {
    width: 340px;
    background: #FFFFFF;
    box-shadow: 0 0 28px rgba(58, 56, 56, 0.15);
    border-radius: 4px;
    padding: 30px 16px 8px;
    margin: 0 auto;
    text-align: center;

    &__title {
      font-weight: bold;
      font-size: 18px;
      margin-bottom: 16px;
    }

    &__message {
      font-size: 15px;
      color: #424242;
      padding-bottom: 36px;
      border-bottom: 1px solid #EFEFEF;
      white-space: pre-wrap;
    }
  }
</style>
