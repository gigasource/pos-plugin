<template>
  <g-dialog v-model="internalValue" width="600" eager>
    <div class="dialog">
      <div class="dialog-title">Availability setting</div>
      <div class="dialog-content">
        <p>Pickup only</p>
        <div>
          <g-switch v-model="pickupOnly"/>
        </div>
        <p>Limit to a set of time</p>
        <div>
          <g-switch v-model="active"/>
        </div>
        <div>Days of week</div>
        <div class="row-flex br-1 flex-wrap b-grey ba-thin">
          <g-checkbox color="indigo accent-2" class="col-4" v-model="dayInWeek[0]" :value="true"
                      :label="$t('common.weekday.monday')"/>
          <g-checkbox color="indigo accent-2" class="col-4" v-model="dayInWeek[1]" :value="true"
                      :label="$t('common.weekday.thursday')"/>
          <g-checkbox color="indigo accent-2" class="col-4" v-model="dayInWeek[2]" :value="true"
                      :label="$t('common.weekday.sunday')"/>
          <g-checkbox color="indigo accent-2" class="col-4" v-model="dayInWeek[3]" :value="true"
                      :label="$t('common.weekday.tuesday')"/>
          <g-checkbox color="indigo accent-2" class="col-8" v-model="dayInWeek[4]" :value="true"
                      :label="$t('common.weekday.friday')"/>
          <g-checkbox color="indigo accent-2" class="col-4" v-model="dayInWeek[5]" :value="true"
                      :label="$t('common.weekday.wednesday')"/>
          <g-checkbox color="indigo accent-2" class="col-8" v-model="dayInWeek[6]" :value="true"
                      :label="$t('common.weekday.saturday')"/>
        </div>
        <p>Time available</p>
        <div class="time-picker">
          <div class="time-picker--left">
            <g-time-picker-input use24Hours v-model="startTime"/>
          </div>
          <div class="time-picker--right">
            <g-time-picker-input use24Hours v-model="endTime"/>
          </div>
        </div>
        <div style="align-self: center; display: flex; align-items: center">
          Start date
          <g-menu v-model="menu.startDate" open-on-hover nudge-left="150" nudge-top="10">
            <template v-slot:activator="{on}">
              <g-icon v-on="on" color="#536DFE" size="20" class="ml-1">info</g-icon>
            </template>
            <div class="menu-info">
              • Start date should be chosen on Monday.
            </div>
          </g-menu>
        </div>
        <g-date-picker-input class="date-picker" v-model="startDate"/>
        <div style="align-self: center; display: flex; align-items: center">
          Repeat* <i class="fs-small-2 ml-1">(after week)</i>
          <g-menu v-model="menu.repeat" open-on-hover nudge-left="150" nudge-top="10">
            <template v-slot:activator="{on}">
              <g-icon v-on="on" color="#536DFE" size="20" class="ml-1">info</g-icon>
            </template>
            <div class="menu-info">
              <p>• Set value to 0 make the menu repeat in a weekly basis.</p>
              <p>• Start date is required</p>
            </div>
          </g-menu>
        </div>
        <div>
          <g-text-field-bs v-model="repeat" large/>
        </div>
      </div>
      <div class="dialog-message">
        <b>Note: </b>
        This option is for dishes only available in a fixed period of time.
      </div>
      <div class="dialog-action">
        <g-btn-bs min-width="120" large text-color="#424242" @click="cancel">Cancel</g-btn-bs>
        <g-btn-bs min-width="120" large text-color="white" background-color="#1271FF" :disabled="unavailableConfirm"
                  @click="save">Save
        </g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  import dayjs from 'dayjs'
  import _ from 'lodash'

  export default {
    name: "dialogAvailabilitySetting",
    props: {
      value: Boolean,
      availability: Object,
    },
    data() {
      return {
        pickupOnly: false,
        active: false,
        dayInWeek: [false, false, false, false, false, false, false],
        startTime: '',
        endTime: '',
        startDate: '',
        repeat: '',
        menu: {
          repeat: false,
          startDate: false
        }
      }
    },
    watch: {
      availability: {
        handler: function (val) {
          if (val) {
            this.pickupOnly = _.cloneDeep(val.pickupOnly)
            this.active = _.cloneDeep(val.active)
            if (val.active) {
              this.dayInWeek = _.cloneDeep(val.dayInWeek)
              this.startTime = _.cloneDeep(val.startTime)
              this.endTime = _.cloneDeep(val.endTime)
              this.startDate = val.startDate ? dayjs(val.startDate).format('YYYY-MM-DD') : ''
              this.repeat = _.cloneDeep(val.repeat)
            } else {
              this.dayInWeek = [false, false, false, false, false, false, false]
              this.startTime = ''
              this.endTime = ''
              this.startDate = ''
              this.repeat = ''
            }
          } else {
            this.pickupOnly = false
            this.active = false
            this.dayInWeek = [false, false, false, false, false, false, false]
            this.startTime = ''
            this.endTime = ''
            this.startDate = ''
            this.repeat = ''
          }
        },
        immediate: true
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
        }
      },
      unavailableConfirm() {
        if (+this.repeat) {
          return !this.startDate
        }
        return false
      }
    },
    methods: {
      cancel() {
        if (this.availability) {
          this.pickupOnly = _.cloneDeep(this.availability.pickupOnly)
          this.active = _.cloneDeep(this.availability.active)
          if (this.availability.active) {
            this.dayInWeek = _.cloneDeep(this.availability.dayInWeek)
            this.startTime = _.cloneDeep(this.availability.startTime)
            this.endTime = _.cloneDeep(this.availability.endTime)
            this.startDate = this.availability.startDate ? dayjs(this.availability.startDate).format('YYYY-MM-DD') : ''
            this.repeat = _.cloneDeep(this.availability.repeat)
          } else {
            this.dayInWeek = [false, false, false, false, false, false, false]
            this.startTime = ''
            this.endTime = ''
            this.startDate = ''
            this.repeat = ''
          }
        } else {
          this.pickupOnly = false
          this.active = false
          this.dayInWeek = [false, false, false, false, false, false, false]
          this.startTime = ''
          this.endTime = ''
          this.startDate = ''
          this.repeat = ''
        }
        this.internalValue = false
      },
      save() {
        const availability = {
          pickupOnly: this.pickupOnly,
          active: this.active,
          dayInWeek: this.dayInWeek.map(day => !!day),
          startTime: this.startTime,
          endTime: this.endTime,
          startDate: this.startDate ? dayjs(this.startDate).toDate() : null,
          repeat: this.repeat
        }
        this.$emit('submit', availability)
      }
    }
  }
</script>

<style scoped lang="scss">
  .dialog {
    background-color: white;
    padding: 24px;
    width: 100%;
    border-radius: 8px;

    &-title {
      color: #212121;
      font-size: 24px;
      font-weight: 700;
      margin-top: 12px;
      margin-bottom: 12px;
    }

    &-content {
      display: grid;
      grid-template-columns: 30% calc(70% - 8px);
      grid-template-rows: 45px 45px 108px 45px 45px 45px;
      grid-gap: 8px;

      & > p {
        align-self: center;
      }

      .g-checkbox-wrapper {
        margin: 0;
        padding: 6px 4px;
      }

      .time-picker {
        display: flex;
        align-items: center;
        border-radius: 2px;
        border: 1px solid #9e9e9e;

        &--left, &--right {
          flex: 0 0 50%;
          align-self: stretch;

          ::v-deep .g-tf-wrapper {
            margin: 4px;
            width: calc(100% - 8px);

            &:before, &:after {
              display: none;
            }

            .g-tf-input {
              text-align: center;
            }
          }
        }

        &--left {
          border-right: 1px solid #9e9e9e;
        }
      }

      .bs-tf-wrapper {
        margin: 0;
        width: 100%;

        ::v-deep .bs-tf-input-group {
          border-color: #9e9e9e;

          .bs-tf-input {
            text-align: center;
          }
        }
      }

      .date-picker {
        border-radius: 2px;
        border: 1px solid #9e9e9e;
        display: flex;
        align-items: center;

        ::v-deep {
          & > div {
            width: 100%;
          }

          .g-tf-wrapper {
            margin: 0;
            width: 100%;

            .g-tf-prepend__outer {
              display: none;
            }

            .g-tf:before, .g-tf:after {
              display: none;
            }

            .input > div {
              display: none;
            }

            .g-tf-input {
              text-align: center;
            }
          }
        }
      }
    }

    &-message {
      margin-top: 16px;
      margin-bottom: 12px;
    }

    &-action {
      display: flex;
      justify-content: flex-end;
      margin-right: -8px;
      margin-top: 36px;
    }
  }

  .menu-info {
    background-color: white;
    padding: 4px
  }
</style>
