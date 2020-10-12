<template>
  <div class="customer">
    <div class="customer-main">
      <g-table striped fixed-header>
        <tr>
          <th>{{$t('onlineOrder.refundDialog.name')}}</th>
          <th>{{$t('onlineOrder.refundDialog.phone')}}</th>
          <th>{{$t('onlineOrder.refundDialog.address')}}</th>
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
      <g-btn-bs :disabled="!selectedCustomer" icon="icon-cancel3@20" background-color="white" text-color="#FF4552" class="elevation-2" @click="dialog.delete = true">
        {{$t('ui.delete')}}
      </g-btn-bs>
      <g-btn-bs :disabled="!selectedCustomer" icon="icon-reservation_modify@20" background-color="#F9A825" class="elevation-2" @click="openDialogEdit">
        {{$t('ui.edit')}}
      </g-btn-bs>
    </g-toolbar>
    <dialog-confirm-delete v-model="dialog.delete" type="Customer" :label="selectedCustomer && selectedCustomer.name" @submit="_deleteCustomer"/>
    <dialog-form-input v-model="dialog.edit" @submit="_updateCustomer">
      <template #input>
        <div class="row-flex flex-wrap justify-around">
          <pos-textfield-new style="width: 48%" label="Name" v-model="name" required/>
          <pos-textfield-new style="width: 48%" label="Phone" v-model="phone" required/>
          <template v-for="(item, i) in addresses">
            <g-combobox style="width: 98%" :label="`Address ${i+1}`" :key="`address_${i}`" v-model="placeId[i]" clearable keep-menu-on-blur
                        :items="autocompleteAddresses[i]" @update:searchText="e => debouceSearchAddress(e, i)"
                        @input="e => selectAutocompleteAddress(e, i)"/>
            <pos-textfield-new style="width: 24%" :label="`Street ${i+1}`" :key="`street_${i}`" v-model="item.street"/>
            <pos-textfield-new style="width: 24%" :label="`Zipcode ${i+1}`" :key="`zipcode_${i}`" v-model="item.zipcode" required/>
            <pos-textfield-new style="width: 24%" :label="`House ${i+1}`" :key="`house_${i}`" v-model="item.house" required/>
            <pos-textfield-new style="width: 24%" :label="`City ${i+1}`" :key="`city_${i}`" v-model="item.city" required/>
          </template>
        </div>
      </template>
    </dialog-form-input>
  </div>
</template>

<script>
  import _ from 'lodash'
  import {v4 as uuidv4} from 'uuid'

  export default {
    name: "PosCustomer",
    injectService: ['OrderStore:(getCustomers, updateCustomer, deleteCustomer)'],
    data() {
      return {
        customers: [],
        selectedCustomer: null,
        sort: '',
        menuSort: false,
        dialog: {
          delete: false,
          edit: false,
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
        this.name = this.selectedCustomer.name
        this.phone = this.selectedCustomer.phone
        this.addresses = this.selectedCustomer.addresses
        this.placeId = this.addresses.map(() => '')
        this.autocompleteAddresses = this.addresses.map(() => [])
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
          this.autocompleteAddresses[index] = places.map(p => ({
            text: p.description,
            value: p.place_id,
          }))
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
  }
</style>
