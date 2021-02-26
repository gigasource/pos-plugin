<template>
  <g-dialog v-model="internalValue" fullscreen>
    <div v-if="mode === 'select'" class="dialog">
      <g-icon size="20" class="dialog-icon--close" @click="internalValue = false">icon-close</g-icon>
      <div class="dialog-title">
        Name: <span>{{name}}</span>
      </div>
      <div class="dialog-title">
        Phone: <span>{{phone}}</span>
      </div>
      <div class="dialog-title">Select address</div>
      <div class="dialog-list">
        <div v-for="(item, i) in addresses" class="dialog-list--item" @click="selectAddress(item, i)">
          <g-radio small v-model="selectedItem" :value="i" :label="`Address ${i+1}`" color="#536DFE"/>
          <p style="color: #3b3b3b">{{item.address}}</p>
          <p style="color: #9e9e9e">{{item.zipcode}}</p>
          <p style="color: #9e9e9e">{{item.city}}</p>
          <div class="row-flex mt-2">
            <g-btn-bs width="120" background-color="#F9A825" text-color="white" icon="icon-reservation_modify@18" @click="changeMode('input', false, true)">Edit
            </g-btn-bs>
            <g-btn-bs width="120" background-color="#FF4452" text-color="white" icon="icon-delete2@18">Delete</g-btn-bs>
          </div>
        </div>
        <g-icon color="#1271ff" size="60" @click="addNewAddress">add_circle</g-icon>
      </div>
      <div class="dialog-title">Time to complete (minute)</div>
      <div class="dialog-list__time">
        <g-btn-bs class="elevation-1" :background-color="time === 15 ? '#BBDEFB' : 'white'" @click="time = 15">15
        </g-btn-bs>
        <g-btn-bs class="elevation-1" :background-color="time === 30 ? '#BBDEFB' : 'white'" @click="time = 30">30
        </g-btn-bs>
        <g-btn-bs class="elevation-1" :background-color="time === 45 ? '#BBDEFB' : 'white'" @click="time = 45">45
        </g-btn-bs>
        <g-btn-bs class="elevation-1" :background-color="time === 60 ? '#BBDEFB' : 'white'" @click="time = 60">60
        </g-btn-bs>
      </div>
      <g-spacer/>
      <div class="dialog-buttons">
        <g-btn-bs icon="icon-note2" background-color="#2979FF" text-color="white" @click="changeMode('input', true)">Add note</g-btn-bs>
        <g-btn-bs icon="check@18" background-color="#388E3C" text-color="white" @click="complete">Complete</g-btn-bs>
      </div>
    </div>
    <div v-if="mode === 'input'" class="dialog">
      <g-icon @click="internalValue = false" class="dialog-icon--close">icon-close@20</g-icon>
      <div class="flex-grow-1 overflow-y pb-3">
        <div class="row-flex flex-wrap justify-around mt-3">
          <pos-textfield-new :disabled="isEditingNote" style="width: 48%" label="Name" placeholder="Name" v-model="name" required/>
          <pos-textfield-new :disabled="isEditingNote" style="width: 48%" label="Phone" placeholder="Phone" v-model="phone" required/>
          <pos-textfield-new :disabled="isEditingNote" style="width: 98%" label="Look up address" placeholder="Delivery address"
                             v-model="address" required/>
          <pos-textfield-new :disabled="isEditingNote" style="width: 23%" label="Street" placeholder="Street name (Autofill)"
                             v-model="street"/>
          <pos-textfield-new :disabled="isEditingNote" style="width: 23%" label="House no." placeholder="House number (Autofill)"
                             v-model="house"/>
          <pos-textfield-new :disabled="isEditingNote" style="width: 23%" label="Zipcode" placeholder="Zipcode (Autofill)"
                             v-model="zipcode"/>
          <pos-textfield-new :disabled="isEditingNote" style="width: 23%" label="City" placeholder="City (Autofill)" v-model="city"/>
          <pos-textfield-new style="width: 98%" label="Delivery note" placeholder="Delivery note"
                             v-model="note"/>
        </div>
      </div>
      <div style="max-height: 50%">
        <pos-keyboard-full @enter-pressed="updateAddress" @change-type="changeKeyboardType" :type="keyboardType"/>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: "dialogOrder",
    props: {
      customer: Object,
      modelValue: Boolean,
      defaultMode: String,
    },
    injectService: ['OrderStore:(createCallInOrder, createCustomer, updateCustomer)'],
    data() {
      return {
        time: 30,
        selectedItem: 0,
        addresses: [],
        mode: 'input',
        name: '',
        phone: '',
        address: '',
        street: '',
        house: '',
        zipcode: '',
        city: '',
        note: '',
        keyboardType: 'alphanumeric',
        isEditingNote: false,
        isEditingAddress: false
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.modelValue
        },
        set(val) {
          this.$emit('update:modelValue', val)
        }
      }
    },
    watch: {
      internalValue: {
        handler(val) {
          this.resetData();
          if (val) {
            const customer = _.cloneDeep(this.customer)
            if (customer) {
              this.name = customer.name === 'New customer' ? '' : customer.name
              this.phone = customer.phone
              this.addresses = customer.addresses
              if (customer.addresses && customer.addresses.length > 0) {
                this.address = customer.addresses[0].address
                this.street = customer.addresses[0].street
                this.house = customer.addresses[0].house
                this.zipcode = customer.addresses[0].zipcode
                this.city = customer.addresses[0].city
                this.mode = 'select'
              } else {
                this.mode = 'input'
              }
            }
          }
        },
        immediate: true
      }
    },
    methods: {
      changeMode(mode, isEditingNote = false, isEditingAddress = false) {
        this.mode = mode
        this.isEditingNote = isEditingNote
        this.isEditingAddress = isEditingAddress
      },
      changeKeyboardType(val) {
        this.keyboardType = val
      },
      resetData() {
        this.name = ''
        this.phone = ''
        this.addresses = []
        this.address = ''
        this.street = ''
        this.house = ''
        this.zipcode = ''
        this.city = ''
        this.note = ''
      },
      selectAddress(item, index) {
        this.address = item.address
        this.street = item.street
        this.house = item.house
        this.zipcode = item.zipcode
        this.city = item.city
        this.selectedItem = index
      },
      updateAddress() {
        if (this.isEditingNote) {
          this.changeMode('select')
          return
        }
        const newAddress = {
          address: this.address,
          street: this.street,
          house: this.house,
          zipcode: this.zipcode,
          city: this.city
        }
        if (this.isEditingAddress) {
          this.addresses.splice(this.selectedItem, 1, newAddress)
        } else {
          this.addresses.push(newAddress)
        }
        this.changeMode('select')
      },
      addNewAddress() {
        this.address = ''
        this.street = ''
        this.house = ''
        this.zipcode = ''
        this.city = ''
        this.changeMode('input')
      },
      async complete() {
        if (this.customer.name === 'New customer') {
          await this.createCustomer({
            name: this.name,
            addresses: this.addresses,
            phone: this.phone,
          })
        } else {
          await this.updateCustomer(this.customer._id, {
            name: this.name,
            addresses: this.addresses,
            phone: this.phone,
          })
        }
        const customer = {
          name: this.name,
          address: this.address,
          phone: this.phone,
          zipCode: this.zipcode
        }
        await this.createCallInOrder(customer, this.time, this.note)
        this.internalValue = false
        this.$router.push({path: '/pos-dashboard'})
      }
    }
  }
</script>

<style scoped lang="scss">
  .dialog {
    width: 100%;
    background-color: white;
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 24px;

    &-icon--close {
      position: absolute;
      top: 24px;
      right: 24px;
    }

    &-title {
      font-size: 20px;
      font-weight: bold;
      margin-top: 8px;

      & > span {
        font-weight: normal;
      }
    }

    &-list {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 4px;
      overflow: auto;

      &--item {
        background: #FFFFFF;
        border: 1px solid #E1E1E1;
        box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.2);
        border-radius: 4px;
        padding: 12px;
        margin-right: 16px;

        & > p {
          line-height: 1.2;
          margin-bottom: 2px;
        }

        .g-btn-bs {
          margin: 0;

          &:first-child {
            margin-right: 8px;
          }
        }

        ::v-deep .g-radio-label {
          font-weight: bold;
        }
      }

      &__time {
        display: flex;
        align-items: center;
        padding: 4px 0;

        .g-btn-bs {
          width: 80px;
          height: 80px;
        }
      }
    }

    &-buttons {
      display: flex;
      justify-content: flex-end;
    }
  }

  @media screen and (max-width: 1023px) {
    .dialog {
      padding: 16px;

      &-icon--close {
        top: 12px;
        right: 12px;
      }

      &-title {
        font-size: 16px;
        margin-top: 0;
      }

      &-list {
        &--item {
          font-size: 14px;
          padding: 8px;
        }

        &__time {
          .g-btn-bs {
            width: 40px;
            height: 40px;
          }
        }
      }
    }
  }
</style>
