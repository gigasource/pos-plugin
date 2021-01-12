<template>
  <div class="customer">
    <div class="customer-main">
      <g-table striped fixed-header>
        <tr>
          <th class="sticky">{{$t('onlineOrder.refundDialog.name')}}</th>
          <th class="sticky">{{$t('onlineOrder.refundDialog.phone')}}</th>
          <th class="sticky">{{$t('onlineOrder.refundDialog.address')}}</th>
        </tr>
        <tr v-for="(customer, i) in sortedCustomer" :key="i" @click="select(customer)"
            :class="[selectedCustomer && selectedCustomer._id === customer._id && 'bordered']">
          <td>{{customer.name}}</td>
          <td>{{customer.phone}}</td>
          <td>
            <p v-for="(item, index) in customer.addresses" :key="`address_${i}_${index}`">
              {{item.address}}
            </p>
          </td>
        </tr>
      </g-table>
    </div>
    <g-toolbar class="customer-toolbar" color="grey lighten 3">
      <g-btn-bs icon="icon-back@20" background-color="white" class="elevation-2" @click="back">
        {{$t('ui.back')}}
      </g-btn-bs>
      <g-menu v-model="menuSort">
        <template v-slot:activator="{ on }">
          <g-btn-bs @click="on.click" icon="icon-sort@20" background-color="white" class="elevation-2">
            {{$t('ui.sort')}}
          </g-btn-bs>
        </template>
        <div class="bg-white">
          <g-btn-bs block @click="changeSort('name')">Name</g-btn-bs>
          <g-btn-bs block @click="changeSort('phone')">Phone</g-btn-bs>
        </div>
      </g-menu>
      <g-spacer/>
      <g-btn-bs background-color="#1271FF" text-color="#FFFFFF" class="elevation-2" @click="openDialogAdd">
        <g-icon size="20" color="white" class="mr-2">add_circle</g-icon>
        Add
      </g-btn-bs>
      <g-btn-bs :disabled="!selectedCustomer" icon="icon-cancel3@20" background-color="white" text-color="#FF4552" class="elevation-2" @click="dialog.delete = true">
        {{$t('ui.delete')}}
      </g-btn-bs>
      <g-btn-bs :disabled="!selectedCustomer" icon="icon-reservation_modify@20" background-color="#F9A825" class="elevation-2" @click="openDialogEdit">
        {{$t('ui.edit')}}
      </g-btn-bs>
    </g-toolbar>
    <dialog-confirm-delete v-model="dialog.delete" type="Customer" :label="selectedCustomer && selectedCustomer.name" @submit="_deleteCustomer"/>

    <g-dialog fullscreen v-model="dialog.edit">
      <div class="dialog">
        <div class="dialog-left">
          <div class="row-flex">
            <g-text-field :virtual-event="isIOS" outlined style="flex: 1" label="Name" v-model="name"/>
            <g-text-field :virtual-event="isIOS" outlined style="flex: 1" label="Phone" v-model="phone"/>
          </div>
          <div class="row-flex flex-wrap justify-around mt-4 r" v-for="(item, i) in addresses">
            <div class="btn-delete" @click="removeAddress(i)">
                <g-icon>icon-cancel3</g-icon>
            </div>
            <div class="row-flex">
              <g-combobox :label="`Address ${i+1}`" :key="`address_${i}`" v-model="placeId[i]" clearable keep-menu-on-blur class="col-8" menu-class="menu-autocomplete-address"
                          :items="autocompleteAddresses[i]" @update:searchText="e => debouceSearchAddress(e, i)" :virtual-event="isIOS" outlined
                          @update:modelValue="e => selectAutocompleteAddress(e, i)"/>
              <g-text-field :label="`House ${i+1}`" :key="`house_${i}`" v-model="item.house" :virtual-event="isIOS" outlined/>
            </div>
            <div class="row-flex">
              <g-text-field :label="`Street ${i+1}`" :key="`street_${i}`" v-model="item.street" :virtual-event="isIOS" outlined/>
              <g-text-field :label="`Zipcode ${i+1}`" :key="`zipcode_${i}`" v-model="item.zipcode" :virtual-event="isIOS" outlined/>
              <g-text-field :label="`City ${i+1}`" :key="`city_${i}`" v-model="item.city" :virtual-event="isIOS" outlined/>
            </div>
          </div>
          <g-icon color="#1271FF" size="40" style="margin: 8px calc(50% - 20px)" @click="addAddress">add_circle</g-icon>
        </div>
        <div class="dialog-keyboard">
          <div style="flex: 1" @click="dialog.edit = false"/>
          <div class="keyboard-wrapper">
            <pos-keyboard-full type="alpha-number" @enter-pressed="submit"/>
          </div>
        </div>
      </div>
    </g-dialog>
  </div>
</template>

<script>
  import _ from 'lodash'
  import {v4 as uuidv4} from 'uuid'
  import PosKeyboardFull from '../pos-shared-components/PosKeyboardFull';

  export default {
    name: "PosCustomer",
    injectService: ['OrderStore:(getCustomers, updateCustomer, deleteCustomer, createCustomer)', 'PosStore:isIOS'],
    components: {PosKeyboardFull},
    data() {
      return {
        customers: [],
        selectedCustomer: null,
        sort: '',
        menuSort: false,
        dialog: {
          delete: false,
          edit: false,
          mode: ''
        },
        name: '',
        phone: '',
        addresses: [],
        placeId: [],
        autocompleteAddresses: [],
        debouceSearchAddress: null,
        token: null
      }
    },
    async created() {
      this.customers = await this.getCustomers()
      this.debouceSearchAddress = _.debounce(this.searchAddress, 300)
    },
    async activated() {
      this.customers = await this.getCustomers()
    },
    computed: {
      sortedCustomer() {
        return _.orderBy(this.customers, this.sort)
      }
    },
    methods: {
      back() {
        this.$router.push({
          path: '/pos-dashboard'
        })
      },
      changeSort(sort) {
        this.sort = sort
        this.menuSort = false
      },
      async _deleteCustomer() {
        if(!this.selectedCustomer) return
        await this.deleteCustomer(this.selectedCustomer._id)
        this.customers = await this.getCustomers()
        this.selectedCustomer = null
      },
      select(customer) {
        this.selectedCustomer = customer
      },
      openDialogEdit() {
        this.name = _.cloneDeep(this.selectedCustomer.name)
        this.phone = _.cloneDeep(this.selectedCustomer.phone)
        this.addresses = _.cloneDeep(this.selectedCustomer.addresses)
        this.placeId = this.addresses.map(() => '')
        this.autocompleteAddresses = this.addresses.map(() => [])
        this.dialog.mode = 'edit'
        this.dialog.edit = true
      },
      async _updateCustomer() {
        if(!this.selectedCustomer) return
        await this.updateCustomer(this.selectedCustomer._id, {
          name: this.name,
          phone: this.phone,
          addresses: this.addresses
        })
        this.customers = await this.getCustomers()
        this.selectedCustomer = this.sortedCustomer.find(c => c._id === this.selectedCustomer._id)
        this.dialog.edit = false
      },
      async searchAddress(text, index) {
        if (!text || text.length < 4) return
        this.token = uuidv4()
        cms.socket.emit('searchPlace', text, this.token, places => {
          this.autocompleteAddresses.splice(index, 1, places.map(p => ({
            text: p.description,
            value: p.place_id
          })))
        })
      },
      async selectAutocompleteAddress(place_id, index) {
        if (this.autocompleteAddresses[index].find(item => item.value === place_id)) {
          cms.socket.emit('getPlaceDetail', place_id, this.token, data => {
            if (!_.isEmpty(data)) {
              for (const component of data.address_components) {
                if (component.types.includes('street_number')) {
                  this.addresses[index].house = component.long_name
                }
                if (component.types.includes('route')) {
                  this.addresses[index].street = component.long_name
                }
                if (component.types.includes('postal_code')) {
                  this.addresses[index].zipcode = component.long_name
                }
                if (component.types.includes('locality')) {
                  this.addresses[index].city = component.long_name
                }
              }
              this.addresses[index].address = data.name
            }
          })
        }
      },
      openDialogAdd() {
        this.name = ''
        this.phone = ''
        this.addresses = [{
          address: '',
          house: '',
          zipcode: '',
          street: '',
          city: '',
        }]
        this.placeId = ['']
        this.autocompleteAddresses = [[]]
        this.dialog.mode = 'add'
        this.dialog.edit = true
      },
      async _createCustomer() {
        if(!this.name || !this.phone || !this.addresses || this.addresses.length === 0) return
        await this.createCustomer({
          name: this.name,
          phone: this.phone,
          addresses: this.addresses
        })
        this.customers = await this.getCustomers()
        this.dialog.edit = false
      },
      async submit() {
        this.addresses = this.addresses.map(a => ({
          ...a,
          address: a.street && a.house ? `${a.street} ${a.house}` : a.address
        }))
        if(this.dialog.mode === 'edit') {
          await this._updateCustomer()
        } else if(this.dialog.mode === 'add') {
          await this._createCustomer()
        }
      },
      removeAddress(index) {
        this.addresses.splice(index, 1)
        this.placeId.splice(index, 1)
        this.autocompleteAddresses.splice(index, 1)
      },
      addAddress(){
        this.addresses.push({
          address: '',
          house: '',
          zipcode: '',
          street: '',
          city: '',
        })
        this.placeId.push('')
        this.autocompleteAddresses.push([])
      }
    }
  }
</script>

<style scoped lang="scss">
  .customer {
    height: 100vh;

    &-main {
      height: calc(100% - 64px);
      overflow: scroll;

      .g-table ::v-deep {
        th {
          text-align: left;
          color: #1271FF;
          font-size: 14px;
          border-bottom: 1px solid #979797;
        }

        th:nth-child(1), td:nth-child(1),
        th:nth-child(2), td:nth-child(2) {
          width: 25%;
        }

        .bordered {
          box-shadow: 0 0 4px rgba(18, 113, 255, 0.563019);

          td {
            border-top: 2px solid #1271ff;
            border-bottom: 2px solid #1271ff;
          }

          td:first-child {
            border-left: 2px solid #1271ff;
            padding-left: 14px;
          }

          td:last-child {
            border-right: 2px solid #1271ff;
            padding-right: 14px;
          }
        }
      }
    }

    &-toolbar {
      .g-btn-bs {
        font-size: 14px;
      }
    }

    .sticky {
      position: sticky;
      top: -1px;
      background: white
    }
  }

  .btn-delete {
    position: absolute;
    top: -25px;
    right: 0;
    background-color: white;
    border: 1px solid #ff4452;
    border-radius: 2px;
  }

  .dialog {
    width: 100%;
    background: rgba(21, 21, 21, 0.42);
    display: flex;

    &-left {
      flex: 0 0 45%;
      background-color: white;
      padding: 4px;
      overflow: auto;

      ::v-deep .g-tf-wrapper {
        margin: 4px 2px 4px;
        width: auto;

        fieldset {
          border-width: 1px !important;
          border-color: #9e9e9e;
        }

        &.g-tf__focused fieldset {
          border-color: #1271FF;
        }

        .g-tf-input {
          font-size: 14px;
          padding: 4px;
        }

        .g-tf-label {
          font-size: 14px;
          top: 4px;

          &__active {
            transform: translateY(-13px) translateX(7px) scale(0.75) !important;
          }
        }
      }
    }

    &-keyboard {
      flex: 0 0 55%;
      display: flex;
      flex-direction: column;

      .keyboard-wrapper {
        padding: 4px;
        background-color: #f0f0f0;
      }
    }
  }
</style>
