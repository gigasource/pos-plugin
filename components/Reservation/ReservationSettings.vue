<template>
  <div class="reservation-settings">
    <div class="reservation-settings__header">Reservation Settings</div>
    <div class="reservation-settings__content">
      <div class="reservation-settings__content__section">
        <g-switch class="mb-3" label="Active reservation" v-model="activeReservation"/>
        <g-switch class="mb-3" label="Incoming reservation notification sound" v-model="soundNotification"/>
        <g-switch class="mb-3" label="Hide empty time slots" v-model="hideEmpty"/>
      </div>
      <div class="reservation-settings__content__section">
        <p class="fs-small">Automatically remove overdue reservations after (min)</p>
        <g-grid-select class="mt-3" :items="removeOverdueAfterList" v-model="removeOverdueAfter" mandatory :grid="false">
          <template #default="{item, toggleSelect}">
            <g-btn-bs style="margin: 0 16px 0 0;" border-color="#E0E0E0" text-color="black" height="30" min-width="72" @click.stop="toggleSelect(item)">{{item}}</g-btn-bs>
          </template>
          <template #selected="{item}">
            <g-btn-bs style="margin: 0 16px 0 0;" border-color="#90CAF9" background-color="#E3F2FD" text-color="black" height="30" width="72">{{item}}</g-btn-bs>
          </template>
        </g-grid-select>
      </div>
      <div class="fw-700 mt-3">Manual reservation (Optional)</div>
      <div class="open-hour__row">
        <div class="fs-small fw-700 mr-4">Open hours</div>
        <div :class="['open-hour__row--hour', 'left', errorHour.open && 'error']">
          <g-time-picker-input use24Hours :value="openTime" @input="updateHours($event, 'open')"/>
        </div>
        <div :class="['open-hour__row--hour', 'right', errorHour.close && 'error']">
          <g-time-picker-input use24Hours :value="closeTime" @input="updateHours($event, 'close')"/>
        </div>
      </div>
      <div class="mt-3">
        <p class="fw-700 fs-small">Maximum guest allowance</p>
        <g-grid-select class="mt-3" :items="guestAllowances" v-model="maxGuest" mandatory :grid="false">
          <template #default="{item, toggleSelect}">
            <g-btn-bs style="margin: 0 16px 0 0;" border-color="#E0E0E0" text-color="black" height="30" min-width="72" @click.stop="toggleSelect(item)">{{item}}</g-btn-bs>
          </template>
          <template #selected="{item}">
            <g-btn-bs style="margin: 0 16px 0 0;" border-color="#90CAF9" background-color="#E3F2FD" text-color="black" height="30" width="72">{{item}}</g-btn-bs>
          </template>
        </g-grid-select>
      </div>
      <div class="mt-3">
        <p class="fw-700 fs-small">Maximum time allowance (days)</p>
        <g-grid-select class="mt-3" :items="dayAllowances" v-model="maxDay" mandatory :grid="false">
          <template #default="{item, toggleSelect}">
            <g-btn-bs style="margin: 0 16px 0 0;" border-color="#E0E0E0" text-color="black" height="30" min-width="72" @click.stop="toggleSelect(item)">{{item}}</g-btn-bs>
          </template>
          <template #selected="{item}">
            <g-btn-bs style="margin: 0 16px 0 0;" border-color="#90CAF9" background-color="#E3F2FD" text-color="black" height="30" width="72">{{item}}</g-btn-bs>
          </template>
        </g-grid-select>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'ReservationSettings',
    injectService: ['SettingsStore:(reservationSetting, getReservationSetting, updateReservationSetting)'],
    data() {
      return {
        removeOverdueAfterList: [15, 30, 45, 60, 'Do not delete'],
        openTime: '',
        closeTime: '',
        errorHour: {
          open: false,
          close: false,
        },
        guestAllowances: [20, 30, 50, 100],
        dayAllowances: [2, 7, 14, 30]
      }
    },
    async created() {
      await this.getReservationSetting()
      this.openTime = this.reservationSetting.openTime || ''
      this.closeTime = this.reservationSetting.closeTime || ''
    },
    computed: {
      activeReservation: {
        get() {
          if (this.reservationSetting)
            return this.reservationSetting.activeReservation
          else
            return false
        },
        set(val) {
          this.reservationSetting.activeReservation = val
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
          this.reservationSetting.soundNotification = val
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
          this.reservationSetting.hideEmpty = val
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
          if(val === 'Do not delete') this.reservationSetting.removeOverdueAfter = 0
          else this.reservationSetting.removeOverdueAfter = val

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
          this.reservationSetting.maxGuest = val
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
          this.reservationSetting.maxDay = val
          this.updateReservationSetting()
        }
      },
    },
    methods: {
      updateHours(time, mode) {
        if(mode === 'open') {
          this.openTime = time
          if(this.closeTime && this.openTime > this.closeTime) {
            this.errorHour.open = true
          } else {
            this.errorHour.open = false
            this.reservationSetting.openTime = time
            this.updateReservationSetting()
          }
        }
        if(mode === 'close') {
          this.closeTime = time
          if(this.openTime && this.openTime > this.closeTime) {
            this.errorHour.close = true
          } else {
            this.errorHour.close = false
            this.reservationSetting.closeTime = time
            this.updateReservationSetting()
          }
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .reservation-settings {
    width: 100%;
    height: 100%;
    padding: 24px 48px;
    overflow: scroll;

    &__header {
      font-size: 18px;
      font-weight: 700;
    }

    &__content {
      font-size: 16px;
      p {
        font-weight: 700;
      }

      &__section {
        margin-top: 16px;

        ::v-deep .g-switch-wrapper {
          label {
            padding-left: 48px;
          }
        }
      }

      .open-hour__row {
        display: flex;
        align-items: center;
        margin-top: 16px;

        &--hour {
          background: #E0E0E0;
          font-weight: 700;
          font-size: 15px;
          line-height: 1.9;
          border: 2px solid #E0E0E0;

          &.left {
            border-top-left-radius: 37px;
            border-bottom-left-radius: 37px;
            margin-right: 2px;
            margin-left: 16px;
          }

          &.right {
            border-top-right-radius: 37px;
            border-bottom-right-radius: 37px;
            margin-right: 16px;
          }

          &.error {
            border-color: #ff4452;

            ::v-deep .g-tf-input {
              color: #ff4452;
            }
          }
        }

        ::v-deep .g-tf-wrapper {
          margin: 0;

          &:before, &:after {
            display: none;
          }

          .g-tf-input {
            width: 60px;
            font-weight: 700;
            text-align: center;
            line-height: 1.2;
          }
        }
      }
    }
  }
</style>
