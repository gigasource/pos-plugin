<template>
  <div class="reservation-setting">
    <div class="reservation-setting__title">Reservation</div>
    <div class="reservation-setting__main" v-if="store">
      <div class="reservation-setting__main--left">
        <g-switch class="mb-3" :label="$t('setting.activeReservation')" v-model="activeReservation"/>
        <g-switch class="mb-3" :label="$t('setting.incomeReservationSound')" v-model="soundNotification"/>
        <g-switch class="mb-3" label="Hide empty time slots" v-model="hideEmpty"/>
        <g-switch class="mb-3" label="Send confirmation email" v-model="emailConfirmation"/>
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
        <div class="mb-3 fw-700">Embed Code</div>
        <div>
          <g-textarea style="border: 1px solid #EFEFEF;color: #162D3D" no-resize :value="iframe"></g-textarea>
          <div class="row-flex align-items-center" style="cursor: pointer">
            <g-icon size="14" color="#536DFE" class="mr-1 mb-1">icon-chain-blue</g-icon>
            <span style="color: #536DFE; cursor: pointer; font-weight: 700; font-size: 14px" @click.stop="copyCode">Copy Code</span>
            <g-spacer/>
          </div>
        </div>
      </div>
    </div>
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
        removeOverdueAfterList: [15, 30, 45, 60, 'Do not delete'],
        guestAllowances: [20, 30, 50, 100],
        dayAllowances: [2, 7, 14, 30],
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
    },
    methods: {
      updateReservationSetting() {
        this.$emit('update', {reservationSetting: this.reservationSetting})
      },
      async copyCode() {
        await navigator.clipboard.writeText(this.iframe)
      },
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
        flex: 0 0 calc(55% - 12px);
        margin-right: 12px;
      }

      &--right {
        flex: 0 0 calc(45% - 12px);
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
  }
</style>
