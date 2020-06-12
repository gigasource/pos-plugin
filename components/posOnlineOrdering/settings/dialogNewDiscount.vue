<template>
  <div>
    <g-dialog v-model="internalValue" width="666" eager>
      <div class="dialog">
        <div class="dialog__title">Add New Discount</div>
        <div class="dialog__content">
          <g-text-field-bs label="Name" v-model="name" >
            <template v-slot:append-inner>
              <g-icon @click.stop="openDialog('name')" size="16" class="mb-1">icon-keyboard</g-icon>
            </template>
          </g-text-field-bs>
          <div class="row-flex">
            <div class="col-6">
              <p class="mt-1 ml-1 mb-2">Type</p>
              <div class="row-flex">
                <g-checkbox color="indigo accent-2" v-model="type" value="delivery" label="Delivery"/>
                <g-checkbox color="indigo accent-2" v-model="type" value="pickup" label="Pickup"/>
              </div>
            </div>
            <div class="col-6 row-flex">
              <div class="flex-equal">
                <g-select :items="amounts" v-model="amount.type" text-field-component="GTextFieldBs" :key="internalValue"
                          label="Amount"/>
              </div>
              <div class="col-3" style="padding-top: 28px" v-if="amount.type !== 'freeShipping'">
                <g-text-field-bs type="number" large v-model="amount.value" >
                  <template v-slot:append-inner>
                    <g-icon @click.stop="openDialog('amount')" size="16" class="mb-1">icon-keyboard</g-icon>
                  </template>
                </g-text-field-bs>
              </div>
            </div>
          </div>
          <p class="mt-1 ml-1 mb-2">Condition (Optional)</p>
          <div class="dialog__condition">
            <div class="row-flex">
              <g-checkbox color="indigo accent-2" v-model="conditions.total.active" label="Total value*"/>
              <g-menu v-model="menu[0]" open-on-hover nudge-left="150" nudge-top="10">
                <template v-slot:activator="{on}">
                  <div v-on="on" style="margin-top: 6px">
                    <g-icon color="#536DFE" size="20">info</g-icon>
                  </div>
                </template>
                <div class="menu-info">
                  <p>• Ticking this option will limit your discount to orders with certain value range.</p>
                  <p>• MIN or MAX value can be left empty. </p>
                  <p><b>E.g:</b> If you want to limit your discount to orders with €10 or more, ticking this option and set MIN value to 10, leaving MAX value empty.</p>
                </div>
              </g-menu>
            </div>
            <div :class="['row-flex', 'br-2', 'b-grey', 'ba-thin', !conditions.total.active && 'disabled']">
              <div class="col-6 b-grey brw-thin row-flex align-items-center justify-center pa-2">
                <input type="number" class="ta-center fw-700 fs-large" placeholder="MIN" v-model="conditions.total.value.min" />
                <g-icon @click="openDialog('min')" size="16" class="mb-1">icon-keyboard</g-icon>
              </div>
              <div class="col-6 row-flex align-items-center justify-center pa-2">
                <input type="number" class="ta-center fw-700 fs-large" placeholder="MAX" v-model="conditions.total.value.max" />
                <g-icon @click="openDialog('max')" size="16" class="mb-1">icon-keyboard</g-icon>
              </div>
            </div>
            <div class="row-flex">
              <g-checkbox color="indigo accent-2" v-model="conditions.timePeriod.active" label="Time period"/>
              <g-menu v-model="menu[1]" open-on-hover nudge-left="150" nudge-top="10">
                <template v-slot:activator="{on}">
                  <div v-on="on" style="margin-top: 6px">
                    <g-icon color="#536DFE" size="20">info</g-icon>
                  </div>
                </template>
                <div class="menu-info">
                  <p>• Ticking this option will limit your discount to orders placed in a certain time period.</p>
                  <p>• Not ticking this option will make your discount always applicable.</p>
                </div>
              </g-menu>
            </div>
            <div :class="['row-flex', 'br-2', 'b-grey', 'ba-thin', !conditions.timePeriod.active && 'disabled']">
              <div class="col-6 b-grey brw-thin row-flex align-items-center justify-center pa-2">
                <g-date-picker-input icon="far fa-calendar-alt" class="date-picker" v-model="conditions.timePeriod.value.startDate" :max="conditions.timePeriod.value.endDate"/>
              </div>
              <div class="col-6 row-flex align-items-center justify-center pa-2">
                <g-date-picker-input icon="far fa-calendar-alt" class="date-picker" v-model="conditions.timePeriod.value.endDate" :min="conditions.timePeriod.value.startDate"/>
              </div>
            </div>
            <div class="row-flex">
              <g-checkbox color="indigo accent-2" v-model="conditions.daysOfWeek.active" label="Days of the week"/>
              <g-menu v-model="menu[2]" open-on-hover nudge-left="150" nudge-top="75">
                <template v-slot:activator="{on}">
                  <div v-on="on" style="margin-top: 6px">
                    <g-icon color="#536DFE" size="20">info</g-icon>
                  </div>
                </template>
                <div class="menu-info">
                  <p>• Ticking this option will limit your discount to orders placed in a certain days of the week.</p>
                  <p>• Not ticking this option will make your discount applicable everyday during the week.</p>
                </div>
              </g-menu>
            </div>
            <div :class="['row-flex', 'br-2', 'flex-wrap', 'b-grey', 'ba-thin', !conditions.daysOfWeek.active && 'disabled']">
              <g-checkbox color="indigo accent-2" class="col-4" v-model="conditions.daysOfWeek.value" value="Monday"
                          label="Mon"/>
              <g-checkbox color="indigo accent-2" class="col-4" v-model="conditions.daysOfWeek.value" value="Thursday"
                          label="Thu"/>
              <g-checkbox color="indigo accent-2" class="col-4" v-model="conditions.daysOfWeek.value" value="Sunday"
                          label="Sun"/>
              <g-checkbox color="indigo accent-2" class="col-4" v-model="conditions.daysOfWeek.value" value="Tuesday"
                          label="Tue"/>
              <g-checkbox color="indigo accent-2" class="col-8" v-model="conditions.daysOfWeek.value" value="Friday"
                          label="Fri"/>
              <g-checkbox color="indigo accent-2" class="col-4" v-model="conditions.daysOfWeek.value" value="Wednesday"
                          label="Wed"/>
              <g-checkbox color="indigo accent-2" class="col-8" v-model="conditions.daysOfWeek.value" value="Saturday"
                          label="Sat"/>
            </div>
            <div class="row-flex">
              <g-checkbox color="indigo accent-2" v-model="conditions.zipCode.active" label="Zip code"/>
              <g-menu v-model="menu[3]" open-on-hover nudge-left="150" nudge-top="10">
                <template v-slot:activator="{on}">
                  <div v-on="on" style="margin-top: 6px">
                    <g-icon color="#536DFE" size="20">info</g-icon>
                  </div>
                </template>
                <div class="menu-info">
                  <p>• Ticking this option will limit your discount to orders in a certain area.</p>
                  <p>• Not ticking this option will make your discount available to all zip codes.</p>
                </div>
              </g-menu>
            </div>
            <div :class="[!conditions.zipCode.active && 'disabled']">
              <g-combobox text-field-component="GTextFieldBs" deletable-chips multiple
                          v-model="conditions.zipCode.value">
                <template v-slot:append-inner>
                  <g-icon @click.stop="openDialog('zipCode')" size="16">icon-keyboard</g-icon>
                </template>
              </g-combobox>
            </div>
            <div class="row-flex">
              <g-checkbox color="indigo accent-2" v-model="conditions.coupon.active" label="Coupon"/>
              <g-menu v-model="menu[4]" open-on-hover nudge-left="150" nudge-top="10">
                <template v-slot:activator="{on}">
                  <div v-on="on" style="margin-top: 6px">
                    <g-icon color="#536DFE" size="20">info</g-icon>
                  </div>
                </template>
                <div class="menu-info">
                  <p>• Ticking this option will limit your discount to orders with your specified coupon.</p>
                </div>
              </g-menu>
            </div>
            <div :class="[!conditions.coupon.active && 'disabled']">
              <g-text-field-bs v-model="conditions.coupon.value">
                <template v-slot:append-inner>
                  <g-icon @click.stop="openDialog('coupon')" size="16" class="mb-1">icon-keyboard</g-icon>
                </template>
              </g-text-field-bs>
            </div>
          </div>
          <span style="font-style: italic; color: #424242">*MIN or MAX value can be left empty</span>
          <div class="dialog__action">
            <g-btn-bs width="100" large text-color="#424242" @click="close()">Cancel</g-btn-bs>
            <g-btn-bs width="100" large text-color="white" background-color="indigo-accent-2" :disabled="isSaveBtnDisabled" @click="submit">Save
            </g-btn-bs>
          </div>
        </div>
      </div>
    </g-dialog>
    <!-- dialog input -->
    <dialog-text-filter label="Name" v-model="dialog.name" :default-value="name" @submit="name = $event"/>
    <dialog-number-filter label="Amount Value" v-model="dialog.amount" :default-value="amount.value" @submit="amount.value = +$event"/>
    <dialog-number-filter label="Min Value" v-model="dialog.min" :default-value="conditions.total.value.min" @submit="conditions.total.value.min = +$event"/>
    <dialog-number-filter label="Max Value" v-model="dialog.max" :default-value="conditions.total.value.max" @submit="conditions.total.value.max = +$event"/>
    <dialog-number-filter label="Zipcode" v-model="dialog.zipCode"  @submit="conditions.zipCode.value.push($event)"/>
    <dialog-text-filter label="Coupon" v-model="dialog.coupon" :default-value="conditions.coupon.value" @submit="conditions.coupon.value = $event"/>
  </div>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: 'dialogNewDiscount',
    props: {
      value: Boolean,
      edit: Boolean,
      discount: Object,
      storeCountryLocale: String,
    },
    data() {
      return {
        name: '',
        type: [],
        amount: {
          type: '',
          value: 0,
        },
        conditions: {
          total: {
            active: false,
            value: {
              min: '',
              max: ''
            }
          },
          timePeriod: {
            active: false,
            value: {
              startDate: '',
              endDate: ''
            }
          },
          daysOfWeek: {
            active: false,
            value: []
          },
          zipCode: {
            active: false,
            value: []
          },
          coupon: {
            active: false,
            value:  ''
          }
        },
        amounts: [
          { text: `Number (${$t('common.currency', this.storeCountryLocale)})`, value: 'flat' },
          { text: 'Percentage', value: 'percent' },
          { text: 'Free shipping', value: 'freeShipping' }
        ],
        menu: [false, false, false, false, false],
        dialog: {
          name: false,
          amount: false,
          min: false,
          max: false,
          zipCode: false,
          coupon: false
        }
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
          if (!val) this.resetDiscount()
        }
      },
      isSaveBtnDisabled() {
        if (!this.name || !this.type.length || !this.amount.type) return true
        // const activeConditions = _.reduce(this.conditions, (conditions, { active }, key) => {
        //   if (active) return [...conditions, key]
        //   return conditions
        // }, [])
        //
        // return activeConditions.length === 0
      }
    },
    methods: {
      close() {
        this.internalValue = false
      },
      submit() {
        this.$emit('submit', this.getDiscount())
        this.close()
      },
      getDiscount() {
        return {
          ... this.discount && this.discount._id && { _id: this.discount._id },
          name: this.name,
          type: this.type,
          amount: this.amount,
          conditions: _.reduce(this.conditions, (conditions, { active, value }, key) => {
            if (!active) return conditions
            return Object.assign(conditions, {
              [key]: key === 'timePeriod' ? {
                startDate: dayjs(value.startDate).toDate(),
                endDate: dayjs(value.endDate).toDate()
              } : value
            })
          }, {}),
          enabled: this.discount && !_.isNil(this.discount.enabled) ? this.discount.enabled : true
        }
      },
      resetDiscount() {
        this.name = ''
        this.type = []
        this.amount = {
          type: '',
          value: 0,
        }
        this.conditions = {
          total: {
            active: false,
            value: {
              min: '',
              max: ''
            }
          },
          timePeriod: {
            active: false,
            value: {
              startDate: '',
              endDate: ''
            }
          },
          daysOfWeek: {
            active: false,
            value: []
          },
          zipCode: {
            active: false,
            value: []
          },
          coupon: {
            active: false,
            value: ''
          }
        }
      },
      openDialog(dialogModel) {
        if(!this.$route.query.device) return
        this.dialog[dialogModel] = true
      }
    },
    watch: {
      value(val) {
        if (val && this.edit) {
          this.name = this.discount.name
          this.type = this.discount.type
          this.amount = {
            type: this.discount.amount.type,
            value: this.discount.amount.value,
          }

          const { daysOfWeek, total, coupon, timePeriod, zipCode } = this.discount.conditions;
          this.conditions = {
            total: {
              active: !!total,
              value: total ? total : {
                min: '',
                max: ''
              }
            },
            timePeriod: {
              active: !!timePeriod,
              value: timePeriod ? {
                startDate: dayjs(timePeriod.startDate).format('YYYY-MM-DD'),
                endDate: dayjs(timePeriod.endDate).format('YYYY-MM-DD'),
              } : {
                startDate: '',
                endDate: ''
              }
            },
            daysOfWeek: {
              active: !!daysOfWeek && !!daysOfWeek.length,
              value: daysOfWeek && daysOfWeek.length ? daysOfWeek : []
            },
            zipCode: {
              active: !!zipCode && !!zipCode.length,
              value: zipCode && zipCode.length ? zipCode : []
            },
            coupon: {
              active: !!coupon,
              value: coupon ? coupon : ''
            }
          }
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .dialog {
    width: 100%;
    background: white;
    border-radius: 4px;
    padding: 24px;
    color: #212121;

    &__title {
      font-weight: 600;
      font-size: 24px;
      margin-bottom: 16px;
    }

    &__content {
      max-height: calc(100% - 52px);
      overflow: hidden auto;
    }

    &__condition {
      display: grid;
      grid-template-columns: 30% calc(70% - 8px);
      grid-template-rows: 45px 45px 108px 45px 45px;
      grid-gap: 8px;

      ::v-deep input {
        -moz-appearance: textfield;
        outline: none;
        user-select: text;
        width: 100%;

        &::-webkit-outer-spin-button,
        &::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      }

      .g-checkbox-wrapper {
        margin: 0;
        padding: 6px 4px;
      }

      .date-picker ::v-deep {
        .g-tf-wrapper {
          margin: 0;
        }

        .g-tf {
          &:before, &:after {
            display: none;
          }

          .input > div {
            display: none;
          }

          input {
            text-align: center;
          }
        }
      }

      .g-combobox ::v-deep {
        .bs-tf-wrapper {
          margin: 0;
          width: 100%;

          .input {
            display: flex;
            flex-wrap: wrap;
            flex: 1 1 0;
            min-width: 0;
            align-items: center;
          }

          .bs-tf-input {
            min-width: 0;
            flex: 1;
            height: 40px;
          }
        }
      }

      .bs-tf-wrapper {
        margin: 0;
        width: 100%;
      }
    }

    &__action {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-top: 24px;
    }

    .bs-tf-wrapper ::v-deep {
      .bs-tf-input {
        font-weight: 700;
        width: 100%;
      }
      input[type=number] {
        text-align: center;
      }
    }
  }

  .menu-info {
    width: 400px;
    background: white;
    padding: 16px 12px;
    border-radius: 2px;
    color: #424242;
  }
</style>
