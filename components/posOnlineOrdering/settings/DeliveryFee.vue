<template>
  <div class="delivery-fee">
    <div class="delivery-fee__title">Delivery Fee</div>
    <div class="delivery-fee__content">
      <g-radio-group name="type" v-model="type" row>
        <g-radio small color="#536DFE" label="Zip code" value="zipCode" :class="[type === 'zipCode' && 'selected']"/>
        <g-radio small color="#536DFE" label="Distance" value="distance" :class="[type === 'distance' && 'selected']"/>
      </g-radio-group>
      <g-divider class="my-3" color="#efefef"/>
      <template v-if="type === 'zipCode'">
        <div class="delivery-fee__content-header">
          <div class="col-9">Zip code</div>
          <div class="col-3">Fee (€)</div>
        </div>
        <div class="delivery-fee__content-main">
          <div class="delivery-fee__content-item" v-for="(item, i) in zipCodeFees" :key="i">
            <div class="item-code col-9">
              <input step="1" :value="item.zipCode" @input="e => updateZipCodeDebounce(item, e)"/>
            </div>
            <div class="item-fee col-2">
              <input type="number" :value="item.fee" placeholder="€" @input="e => updateFeeDebounce(item, e)"/>
            </div>
            <div class="item-btn--delete col-1">
              <g-icon size="16" color="#424242" @click="removeFee(i)">icon-close</g-icon>
            </div>
          </div>
          <div class="item-btn--add" @click="addNewFee">
            <g-icon size="40" color="#2979FF">add</g-icon>
          </div>
          <p class="mt-1">Note: You can put zip codes with the same fee in a single line, separated by “,” or “;”</p>
        </div>
        <g-switch v-model="acceptOrderInOtherZipCodes" label="Accept orders with other zip codes"/>
        <div class="row-flex align-items-center">
          <span class="fw-700 mr-2 nowrap">Shipping fee for other zip codes</span>
          <g-text-field-bs type="number" class="bs-tf__pos col-2" v-model="defaultFee"/>
        </div>
      </template>
      <template v-if="type === 'distance'">
        <p class="fs-small"><b>Address: </b>{{address}}</p>
        <p class="fs-small"><b>Coordination: </b>{{obtainedCoordination}}</p>
        <div class="delivery-fee__content-header">
          <div class="col-9">Radius (km)</div>
          <div class="col-3">Fee (€)</div>
        </div>
        <div class="delivery-fee__content-main">
          <div class="delivery-fee__content-item" v-for="(item, i) in distanceFees" :key="i">
            <div class="item-code col-9">
              <input type="number" :value="item.radius" @input="e => updateRadiusDebounce(item, e)"/>
            </div>
            <div class="item-fee col-2">
              <input type="number" :value="item.fee" placeholder="€" @input="e => updateFeeDebounce(item, e)"/>
            </div>
            <div class="item-btn--delete col-1">
              <g-icon size="16" color="#424242" @click="removeFee(i)">icon-close</g-icon>
            </div>
          </div>
          <div class="item-btn--add" @click="addNewFee">
            <g-icon size="40" color="#2979FF">add</g-icon>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: "DeliveryFee",
    props: {
      deliveryFee: Object,
      address: String,
      coordinates: Object
    },
    data() {
      return {
      }
    },
    created() {
      this.setDefaultFeeDebounce = _.debounce(this.setDefaultFee, 1000)
      this.updateZipCodeDebounce = _.debounce(this.updateZipCode, 1000)
      this.updateFeeDebounce = _.debounce(this.updateFee, 1000)
      this.updateRadiusDebounce = _.debounce(this.updateRadius, 1000)
    },
    mounted() {
      const inputs = document.querySelectorAll('input[type=number]')
      for(const input of inputs) {
        input.step = 0.01
      }
    },
    computed: {
      zipCodeFees() {
        return this.deliveryFee.zipCodeFees
      },
      acceptOrderInOtherZipCodes: {
        get() {
          return this.deliveryFee.acceptOrderInOtherZipCodes
        },
        set(val) {
          this.updateDeliveryFee({acceptOrderInOtherZipCodes: val})
        }
      },
      defaultFee: {
        get() {
          return this.deliveryFee.defaultFee
        },
        set(val) {
          this.setDefaultFeeDebounce(val)
        }
      },
      type: {
        get() {
          return this.deliveryFee.type || null
        },
        set(val) {
          this.updateDeliveryFee({type: val})
        }
      },
      distanceFees() {
        return this.deliveryFee.distanceFees
      },
      obtainedCoordination () {
        return _.isEmpty(this.coordinates) ? 'Not Obtained' : 'Obtained'
      }
    },
    methods: {
      addNewFee() {
        if(this.type === 'zipCode')
          this.deliveryFee.zipCodeFees.push({zipCode: '', fee: 0})
        if(this.type === 'distance')
          this.deliveryFee.distanceFees.push({radius: 0, fee: 0})
        this.updateFees()
      },
      updateZipCode(item, e) {
        if (!e.target.value) return
        _.each(this.deliveryFee.zipCodeFees, fee => {
          if (fee === item)
            fee.zipCode = e.target.value
        })
        this.updateFees()
      },
      updateFee(item, e) {
        if(!e.target.value || isNaN(e.target.value)) return
        if(this.type === 'zipCode')
          _.each(this.deliveryFee.zipCodeFees, fee => {
            if (fee === item) {
              fee.fee = e.target.value
            }
          })
        if(this.type === 'distance')
          _.each(this.deliveryFee.distanceFees, fee => {
            if (fee === item) {
              fee.fee = e.target.value
            }
          })
        this.updateFees()
      },
      updateRadius(item, e) {
        if(!e.target.value || isNaN(e.target.value)) return
          _.each(this.deliveryFee.distanceFees, fee => {
            if (fee === item) {
              fee.radius = e.target.value
            }
          })
        this.updateFees()
      },
      updateFees() {
        if(this.type === 'zipCode')
          this.updateDeliveryFee({zipCodeFees: this.deliveryFee.zipCodeFees})
        if(this.type === 'distance')
          this.updateDeliveryFee({distanceFees: this.deliveryFee.distanceFees})
      },
      setDefaultFee(value) {
        if(!value || isNaN(value)) return
        this.updateDeliveryFee({defaultFee: value})
      },
      updateDeliveryFee(change) {
        const deliveryFee = {...this.deliveryFee, ...change}
        this.$emit('update', {deliveryFee})
        this.$nextTick(() => {
          const inputs = document.querySelectorAll('input[type=number]')
          for(const input of inputs) {
            input.step = 0.01
          }
        })
      },
      removeFee(index) {
        if(this.type === 'zipCode')
          this.deliveryFee.zipCodeFees.splice(index, 1)
        if(this.type === 'distance')
          this.deliveryFee.distanceFees.splice(index, 1)
        this.updateFees()
      },
    }
  }
</script>

<style scoped lang="scss">
  .delivery-fee {
    font-size: 14px;
    max-height: 100%;
    overflow: auto;

    &__title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .selected ::v-deep .g-radio-label {
      font-weight: 600;
    }

    &__content {
      width: 70%;
      background: white;
      border-radius: 4px;
      padding: 30px;

      &-header {
        display: flex;
        font-weight: 700;
        margin-bottom: 16px;
      }

      &-item {
        border-radius: 4px;
        margin-bottom: 8px;
        display: flex;
        background: #EFEFEF;

        .item-code,
        .item-fee {
          padding: 12px 16px;
          font-weight: 700;
          background: #FAFAFA;
          border: 1px solid #EFEFEF;

          input {
            width: 100%;
            outline: none;
            font-size: 14px;
            background: transparent;
          }
        }

        .item-code {
          border-radius: 4px 0 0 4px;
        }

        .item-fee {
          border-radius: 0 4px 4px 0;
          border-left: none;
        }

        .item-btn--delete {
          border-radius: 0 4px 4px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        &:focus-within {
          .item-code, .item-fee {
            border: 1px solid #526dfe;
          }

          .item-fee {
            border-left: none;
          }
        }

      }

      .item-btn--add {
        background: #E3F2FD;
        border: 2px dashed #BBDEFB;
        border-radius: 2px;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      }
    }

    .g-switch ::v-deep .g-switch-label {
      font-size: 14px;
    }

    ::v-deep input[type=number] {
      -moz-appearance: textfield;
      outline: none;
      user-select: text;
    }

    ::v-deep input::-webkit-outer-spin-button,
    ::v-deep input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }

    .bs-tf-wrapper ::v-deep {
      .bs-tf-inner-input-group {
        padding: 0;

        .bs-tf-input {
          padding: 6px 12px;
        }
      }
    }
  }
</style>
