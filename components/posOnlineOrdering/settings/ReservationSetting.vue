<template>
  <div class="reservation-setting">
    <div class="reservation-setting__title">Reservation</div>
    <div class="reservation-setting__main" v-if="store">
      <div class="reservation-setting__main--left">
        <g-switch class="mb-3" :label="$t('setting.activeReservation')" v-model="activeReservation"/>
        <g-switch class="mb-3" :label="$t('setting.incomeReservationSound')" v-model="soundNotification"/>
        <g-switch class="mb-3" :label="$t('setting.hideEmpty')" v-model="hideEmpty"/>
        <g-switch class="mb-3" :label="$t('setting.sendConfirmEmail')" v-model="emailConfirmation"/>
        <p class="fw-700 fs-small mt-3">{{$t('setting.autoRemoveOverdue')}}</p>
        <g-grid-select :items="removeOverdueAfterList" v-model="removeOverdueAfter" mandatory :grid="false">
          <template #default="{item, toggleSelect}">
            <g-btn-bs style="margin: 16px 16px 0 0;" border-color="#E0E0E0" text-color="black" height="30" min-width="72" @click.stop="toggleSelect(item)">{{item}}</g-btn-bs>
          </template>
          <template #selected="{item}">
            <g-btn-bs style="margin: 16px 16px 0 0;" border-color="#90CAF9" background-color="#E3F2FD" text-color="black" height="30" width="72">{{item}}</g-btn-bs>
          </template>
        </g-grid-select>
        <p class="fw-700 fs-small mt-3">{{$t('setting.maxGuest')}}</p>
        <g-grid-select :items="guestAllowances" v-model="maxGuest" mandatory :grid="false">
          <template #default="{item, toggleSelect}">
            <g-btn-bs style="margin: 16px 16px 0 0;" border-color="#E0E0E0" text-color="black" height="30" min-width="72" @click.stop="toggleSelect(item)">{{item}}</g-btn-bs>
          </template>
          <template #selected="{item}">
            <g-btn-bs style="margin: 16px 16px 0 0;" border-color="#90CAF9" background-color="#E3F2FD" text-color="black" height="30" width="72">{{item}}</g-btn-bs>
          </template>
        </g-grid-select>
        <p class="fw-700 fs-small mt-3">{{$t('setting.maxTime')}}</p>
        <g-grid-select :items="dayAllowances" v-model="maxDay" mandatory :grid="false">
          <template #default="{item, toggleSelect}">
            <g-btn-bs style="margin: 16px 16px 0 0;" border-color="#E0E0E0" text-color="black" height="30" min-width="72" @click.stop="toggleSelect(item)">{{item}}</g-btn-bs>
          </template>
          <template #selected="{item}">
            <g-btn-bs style="margin: 16px 16px 0 0;" border-color="#90CAF9" background-color="#E3F2FD" text-color="black" height="30" width="72">{{item}}</g-btn-bs>
          </template>
        </g-grid-select>
      </div>
      <div class="reservation-setting__main--right">
        <div class="row-flex align-items-center">
          <p class="fw-700 fs-small">{{$t('setting.seatLimit')}}</p>
          <g-spacer/>
          <g-btn-bs icon="add@14" text-color="indigo accent-2" @click="dialog.seat = true">Add new</g-btn-bs>
        </div>
        <div v-if="seatLimitItems && seatLimitItems.length > 0" class="reservation-setting__seat-table">
          <div class="reservation-setting__seat-table--header">
            <div class="col-4 ml-1">From/To</div>
            <div class="col-5">Day</div>
            <div class="col-2 ta-center">Seat limit</div>
          </div>
          <div v-for="(seat, i) in seatLimitItems" :class="['reservation-setting__seat-table--row', i % 2 !== 0 && 'reservation-setting__seat-table--row--even']" :key="`seat_${i}`">
            <div class="col-4 ml-1">{{seat.time}}</div>
            <div class="col-5">{{seat.day}}</div>
            <div class="col-2 ta-center">{{seat.seat}}</div>
            <div class="col-1">
              <g-icon title="Delete" @click="removeSeatLimit(seat._id)" color="#ff4552">mdi-trash-can</g-icon>
            </div>
          </div>
        </div>
      </div>
    </div>

    <g-dialog v-model="dialog.seat" width="480" eager>
      <div class="dialog">
        <div class="dialog-title">{{$t('setting.seatLimit')}}</div>
        <div class="dialog-content">
          <div>{{$t('setting.fromTo')}}</div>
          <div class="row-flex">
            <div class="dialog__time--from">
              <g-time-picker-input use24Hours :value="newSeatLimit.startTime" @input="newSeatLimit.startTime = $event"/>
            </div>
            <div class="dialog__time--to">
              <g-time-picker-input use24Hours :value="newSeatLimit.endTime" @input="newSeatLimit.endTime = $event"/>
            </div>
          </div>
          <div>{{$t('setting.day')}}</div>
          <div class="row-flex br-1 flex-wrap b-grey ba-thin">
            <g-checkbox color="indigo accent-2" class="col-3 mr-3" v-model="newSeatLimit.days" value="Mon" :label="$t('common.weekday.monday').substring(0,3)"/>
            <g-checkbox color="indigo accent-2" class="col-3 mr-3" v-model="newSeatLimit.days" value="Thu" :label="$t('common.weekday.thursday').substring(0,3)"/>
            <g-checkbox color="indigo accent-2" class="col-3 mr-3" v-model="newSeatLimit.days" value="Sun" :label="$t('common.weekday.sunday').substring(0,3)"/>
            <g-checkbox color="indigo accent-2" class="col-3 mr-3" v-model="newSeatLimit.days" value="Tue" :label="$t('common.weekday.tuesday').substring(0,3)"/>
            <g-checkbox color="indigo accent-2" class="col-8" v-model="newSeatLimit.days" value="Fri" :label="$t('common.weekday.friday').substring(0,3)"/>
            <g-checkbox color="indigo accent-2" class="col-3 mr-3" v-model="newSeatLimit.days" value="Wed" :label="$t('common.weekday.wednesday').substring(0,3)"/>
            <g-checkbox color="indigo accent-2" v-model="newSeatLimit.days" value="Sat" :label="$t('common.weekday.saturday').substring(0,3)"/>
          </div>
          <div>{{$t('setting.seatLimit')}}</div>
          <g-text-field-bs v-model="newSeatLimit.seat" type="number"/>
        </div>
        <div v-if="errorSeatLimit" class="i fs-small-2 text-red mt-1">Dupplicate time/day with other seat limit!</div>
        <div class="dialog-action">
          <g-btn-bs text-color="#424242" @click="closeDialogSeat">{{$t('setting.cancel')}}</g-btn-bs>
          <g-btn-bs :disabled="!this.newSeatLimit.startTime || !this.newSeatLimit.endTime || this.newSeatLimit.days.length === 0 || !this.newSeatLimit.seat
          || this.newSeatLimit.endTime < this.newSeatLimit.startTime || errorSeatLimit"
                    width="110" background-color="#1271FF" @click="addSeatLimit">{{$t('setting.add')}}</g-btn-bs>
        </div>
      </div>
    </g-dialog>
  </div>
</template>

<script>
  export default {
    name: "ReservationSetting",
    props: {
      store: Object
    },
    data() {
      return {
        reservationSetting: this.store.reservationSetting || {},
        removeOverdueAfterList: [15, 30, 45, 60, $t('setting.dontDelete')],
        guestAllowances: [20, 30, 50, 100],
        dayAllowances: [2, 7, 14, 30],
        dialog: {
          seat: false,
        },
        seatLimit: (this.store.reservationSetting && this.store.reservationSetting.seatLimit) || [],
        newSeatLimit: {
          startTime: '',
          endTime: '',
          days: [],
          seat: '',
        }
      }
    },
    computed: {
      iframe() {
        const url = [location.origin, 'reservation', this.store.alias].join('/');
        return `<div id="reservation-embed-btn" class="reservation-embed-btn" data-url="${url}" data-width="120">Reservation</div><script type="application/javascript" src="https://cdn.pos.gigasource.io/cms-files/files/view/js-scripts/reservation-embed.js"><\/script>`
      },
      activeReservation: {
        get() {
          if (this.reservationSetting)
            return this.reservationSetting.activeReservation
          else
            return false
        },
        set(val) {
          this.$set(this.reservationSetting, 'activeReservation', val)
          this.updateReservationSetting()
        }
      },
      soundNotification: {
        get() {
          if (this.reservationSetting)
            return this.reservationSetting.soundNotification
          else
            return false
        },
        set(val) {
          this.$set(this.reservationSetting, 'soundNotification', val)
          this.updateReservationSetting()
        }
      },
      hideEmpty: {
        get() {
          if (this.reservationSetting)
            return this.reservationSetting.hideEmpty
          else
            return false
        },
        set(val) {
          this.$set(this.reservationSetting, 'hideEmpty', val)
          this.updateReservationSetting()
        }
      },
      emailConfirmation: {
        get() {
          return this.reservationSetting ? this.reservationSetting.emailConfirmation : false
        },
        set(val) {
          this.$set(this.reservationSetting, 'emailConfirmation', val)
          this.updateReservationSetting()
        }
      },
      removeOverdueAfter: {
        get() {
          if (this.reservationSetting)
            return this.reservationSetting.removeOverdueAfter
          else
            return 0
        },
        set(val) {
          if(val === 'Do not delete')
            this.$set(this.reservationSetting, 'removeOverdueAfter', 0)
          else
            this.$set(this.reservationSetting, 'removeOverdueAfter', val)
          this.updateReservationSetting()
        }
      },
      maxGuest: {
        get() {
          if (this.reservationSetting)
            return this.reservationSetting.maxGuest
          else
            return 0
        },
        set(val) {
          this.$set(this.reservationSetting, 'maxGuest', val)
          this.updateReservationSetting()
        }
      },
      maxDay: {
        get() {
          if (this.reservationSetting)
            return this.reservationSetting.maxDay
          else
            return 0
        },
        set(val) {
          this.$set(this.reservationSetting, 'maxDay', val)
          this.updateReservationSetting()
        }
      },
      seatLimitItems() {
        return this.seatLimit.map(({startTime, endTime, days, seat, _id}) => ({
          time: `${startTime} - ${endTime}`,
          day: days.join(', '),
          seat,
          _id
        }))
      },
      errorSeatLimit() {
        if(this.seatLimit && this.seatLimit.length > 0) {
          if(!this.newSeatLimit.startTime || !this.newSeatLimit.endTime || this.newSeatLimit.days.length === 0 || !this.newSeatLimit.seat || this.newSeatLimit.startTime > this.newSeatLimit.endTime) {
            return false
          }
          for(const seatLimit of this.seatLimit) {
            if(seatLimit.days.some(s => this.newSeatLimit.days.includes(s)) &&
                ((seatLimit.startTime >= this.newSeatLimit.startTime && seatLimit.startTime <= this.newSeatLimit.endTime) ||
                    (seatLimit.endTime >= this.newSeatLimit.startTime && seatLimit.endTime <= this.newSeatLimit.endTime))) {
              return true
            }
          }
        }
        return false
      }
    },
    methods: {
      updateReservationSetting() {
        this.$emit('update', {reservationSetting: this.reservationSetting})
      },
      async copyCode() {
        await navigator.clipboard.writeText(this.iframe)
      },
      closeDialogSeat() {
        this.newSeatLimit.startTime = ''
        this.newSeatLimit.endTime = ''
        this.newSeatLimit.days = []
        this.newSeatLimit.seat = ''
        this.dialog.seat = false
      },
      addSeatLimit() {
        const item = _.cloneDeep(this.newSeatLimit)
        this.seatLimit.push(item)
        this.reservationSetting.seatLimit = this.seatLimit
        this.updateReservationSetting()
        this.closeDialogSeat()
      },
      removeSeatLimit(_id) {
        const index = this.seatLimit.findIndex(s => s._id === _id)
        this.seatLimit.splice(index, 1)
        this.reservationSetting.seatLimit = this.seatLimit
        this.updateReservationSetting()
      }
    }
  }
</script>

<style scoped lang="scss">
  .reservation-setting {
    overflow-y: auto;
    max-height: 100%;

    &__title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    &__main {
      display: flex;

      &--left,
      &--right {
        background-color: #FFF;
        border-radius: 5px;
        padding: 24px;
        margin-bottom: 24px;
      }

      &--left {
        flex: 0 0 calc(50% - 12px);
        margin-right: 12px;
      }

      &--right {
        flex: 0 0 calc(50% - 12px);
        margin-left: 12px;
        align-self: flex-start;

        .g-textarea {
          margin-right: 4px;
          width: calc(100% - 5px);

          ::v-deep .g-tf {
            &:before, &:after {
              display: none;
            }
          }

          ::v-deep fieldset {
            border-width: 1px !important;
            border-color: #ced4da;

            &:focus-within {
              border-color: #80bdff !important;
              box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
              z-index: 2;
            }

            .g-tf-input {
              padding: 12px;
              font-size: 15px;
            }

            .g-tf-append__inner {
              display: none;
            }

            textarea {
              user-select: text !important;
              max-height: 120px;
            }
          }
        }
      }
    }

    &__seat-table {
      background: #FFFFFF;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1398);
      border-radius: 2px;
      margin-top: 8px;

      &--header {
        background: #EFEFEF;
        height: 38px;
        display: flex;
        align-items: center;
        font-size: 12px;
        font-weight: 700;
        color: #757575;
      }

      &--row {
        display: flex;
        align-items: center;
        padding-top: 8px;
        padding-bottom: 8px;
        font-size: 14px;

        &--even {
          background: #FAFAFC;
        }
      }
    }
  }

  .dialog {
    background: white;
    border-radius: 4px;
    padding: 24px;
    width: 100%;

    &-title {
      font-size: 24px;
      font-weight: 600;
      color: #212121;
      margin-bottom: 20px;
    }

    &-content {
      display: grid;
      grid-template-columns: 20% 80%;
      grid-template-rows: auto auto auto;
      grid-gap: 12px;
      align-items: center;
      font-size: 14px;

      .dialog__time {
        &--from {
          border-radius: 2px 0 0 2px;
          border: 1px solid #9e9e9e;
        }

        &--to {
          border-radius: 0 2px 2px 0;
          border: 1px solid #9e9e9e;
          border-left: none;
        }
      }

      ::v-deep .g-tf-wrapper {
        margin: 0;

        &:before, &:after {
          display: none;
        }

        .g-tf-input {
          text-align: center;
          padding: 6px 0;
        }
      }

      ::v-deep .bs-tf-wrapper {
        margin: 0;
        width: 100%;

        .bs-tf-input-group {
          border-color: #9e9e9e;

          .bs-tf-inner-input-group {
            border-radius: 2px;
          }
        }
      }
    }

    &-action {
      display: flex;
      margin-top: 16px;
      justify-content: flex-end;
      margin-right: -8px;
    }
  }
</style>
