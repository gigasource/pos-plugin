<template>
  <div class="delivery">
    <div class="delivery-info">
      <p class="delivery-info__title">Favorite</p>
      <div class="delivery-info__favorite">
        <div :style="getRandomColor(i)" class="delivery-info__favorite-item" v-for="(f, i) in favorites"
             @click="selectFavoriteProduct(f)"
             :key="`favorite_${i}`">
          {{f.name}}
        </div>
      </div>
      <p class="delivery-info__title">Customer Infomation</p>
      <div class="delivery-info__customer">
        <template v-if="!isNewCustomer">
          <div
              :class="['delivery-info__customer-address', selectedAddress === i && 'delivery-info__customer-address--selected']"
              v-for="(item, i) in selectedCustomer.addresses" @click="selectAddress(i)">
            <div class="row-flex align-items-center">
              <g-radio small v-model="selectedAddress" :value="i" :label="`Address ${i+1}`" color="#536DFE"/>
              <g-spacer/>
              <g-btn-bs small style="margin: 0 2px; padding: 4px;" background-color="#F9A825" @click="openDialog('edit', item.address, item.zipcode, i)">
                <g-icon size="15">icon-reservation_modify</g-icon>
              </g-btn-bs>
              <g-btn-bs small style="margin: 0 2px; padding: 4px;" background-color="#FF4452" @click="removeAddress(i)">
                <g-icon size="15">icon-delete</g-icon>
              </g-btn-bs>
            </div>
            <p>{{item.address}}</p>
            <p class="text-grey fs-small">{{item.zipcode}}</p>
            <p class="text-grey fs-small">{{item.city}}</p>
          </div>
          <g-icon size="40" color="#1271FF" @click="openDialog('add')">add_circle</g-icon>
        </template>
        <template v-else>
          <g-text-field-bs class="bs-tf__pos" label="Name" v-model="name" @click="openDialog('add')">
            <template v-slot:append-inner>
              <g-icon @click="openDialog('add')">icon-keyboard</g-icon>
            </template>
          </g-text-field-bs>
          <g-text-field-bs class="bs-tf__pos" label="Address" v-model="address" @click="openDialog('add')">
            <template v-slot:append-inner>
              <g-icon @click="openDialog('add')">icon-keyboard</g-icon>
            </template>
          </g-text-field-bs>
          <g-text-field-bs class="bs-tf__pos" label="Zipcode" v-model="zipcode" @click="openDialog('add')">
            <template v-slot:append-inner>
              <g-icon @click="openDialog('add')">icon-keyboard</g-icon>
            </template>
          </g-text-field-bs>
        </template>
      </div>
    </div>
    <div class="delivery-order">
      <div class="delivery-order__content">
        <g-autocomplete text-field-component="GTextFieldBs" v-model="selectedProduct" :items="products"
                        @input="chooseProduct" ref="autocomplete" :filter="(itemText, text) => {
                          return itemText.toLowerCase().includes(text.toLowerCase())
                        }"
                        return-object/>
        <g-text-field-bs v-if="selectedProduct" class="bs-tf__pos quantity" v-model="quantity" label="Quantity"/>
        <g-text-field-bs v-if="selectedProduct" class="bs-tf__pos" :value="selectedProduct.price" label="Price" @input="debouceUpdatePrice"/>
        <g-text-field-bs v-if="selectedProduct" class="bs-tf__pos" v-model="selectedProduct.note" label="Note"/>
        <template v-if="selectedProduct && selectedProduct.choices && selectedProduct.choices.length > 0">
          <div v-for="(choice, iC) in selectedProduct.choices" class="delivery-order__choice" :key="`choice_${iC}`">
            <p class="delivery-order__choice-title">
              {{choice.name}}
              <span v-if="choice.mandatory" class="text-red">*</span>
            </p>
            <div class="delivery-order__options">
              <div v-for="(option, iO) in choice.options" :key="`option_${iC}_ ${iO}`"
                   @click.stop="selectOption(choice, option)"
                   :class="['delivery-order__option', isModifierSelect(option) && 'delivery-order__option--selected']">
                {{option.name}} - {{$t('common.currency', storeLocale)}}{{option.price}}
              </div>
            </div>
          </div>
        </template>
      </div>
      <g-btn-bs block large style="margin: -8px; border-radius: 0" icon="icon-kitchen" background-color="#0EA76F"
                :disabled="unavailableToAdd" @click="addProduct">Add to order list
      </g-btn-bs>
    </div>
    <div class="delivery-detail">
      <div class="delivery-detail__info">
        <g-avatar size="36">
          <img alt :src="avatar">
        </g-avatar>
        <div class="delivery-detail__info-username">{{username}}</div>
        <g-spacer/>
        <g-btn-bs class="elevation-1" @click="back" style="border-radius: 50%; padding: 6px">
          <g-icon>icon-back</g-icon>
        </g-btn-bs>
        <g-spacer/>
        <div class="delivery-detail__total">{{$t('common.currency', storeLocale)}}{{total | convertMoney}}</div>
      </div>
      <div class="delivery-detail__order">
        <div v-for="(item, i) in itemsWithQty" :key="i" class="item">
          <div class="item-detail">
            <div>
              <p class="item-detail__name">{{item.id}}. {{item.name}}</p>
              <p>
                <span :class="['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']">€{{item.originalPrice | convertMoney}}</span>
                <span class="item-detail__price--new" v-if="isItemDiscounted(item)">{{$t('common.currency', storeLocale)}} {{item.price | convertMoney }}</span>
              </p>
            </div>
            <div class="item-action">
              <g-icon @click.stop="removeItem(item)">remove_circle_outline</g-icon>
              <span>{{item.quantity}}</span>
              <g-icon @click.stop="addItem(item)">add_circle_outline</g-icon>
            </div>
          </div>
          <div v-if="item.modifiers">
            <g-chip v-for="(modifier, index) in item.modifiers" :key="`${item._id}_${index}`"
                    label small text-color="#616161" close @close="removeModifier(item, index)">
              {{modifier.name}} | {{$t('common.currency', storeLocale)}}{{modifier.price | convertMoney}}
            </g-chip>
          </div>
        </div>
      </div>
      <g-btn-bs block large style="margin: -8px; border-radius: 0" icon="icon-print" background-color="#2979FF" @click="dialog.order = true">Send to
        kitchen
      </g-btn-bs>
    </div>
    <dialog-form-input v-model="dialog.input" @submit="addNewCustomer">
      <template #input>
        <div class="row-flex flex-wrap justify-around">
          <pos-textfield-new style="width: 48%" label="Name" v-model="name"/>
          <pos-textfield-new style="width: 48%" label="Phone" v-model="phone"/>
          <g-combobox style="width: 98%" label="Address" v-model="placeId"
                      :items="autocompleteAddresses" @update:searchText="debouceSearchAddress"
                      @input="selectAutocompleteAddress"/>
          <pos-textfield-new style="width: 23%" label="Street" placeholder="Street name (Autofill)"
                             v-model="street"/>
          <pos-textfield-new style="width: 23%" label="House no." placeholder="House number (Autofill)"
                             v-model="house"/>
          <pos-textfield-new style="width: 23%" label="Zipcode" placeholder="Zipcode (Autofill)"
                             v-model="zipcode"/>
          <pos-textfield-new style="width: 23%" label="City" placeholder="City (Autofill)" v-model="city"/>
        </div>
      </template>
    </dialog-form-input>
    <g-dialog v-model="dialog.order" width="500" eager>
      <g-card class="dialog r">
        <g-icon class="dialog-icon--close" @click="closeDialogConfirm" size="20">icon-close</g-icon>
        <div class="mx-2">
          <b>Name: </b> {{this.selectedCustomer.name}}
        </div>
        <div class="mx-2">
          <b>Phone: </b> {{this.selectedCustomer.phone}}
        </div>
        <div class="mx-2">
          <b>Address: </b> {{this.selectedCustomer.addresses && this.selectedCustomer.addresses.length > 0 && this.selectedCustomer.addresses[this.selectedAddress].address}}
          {{this.selectedCustomer.addresses && this.selectedCustomer.addresses.length > 0 && this.selectedCustomer.addresses[this.selectedAddress].zipcode}}
        </div>
        <g-text-field-bs label="Delivery note:" v-model="note"/>
        <div class="ma-2">Time to complete (minute)</div>
        <div class="mb-3">
          <g-btn-bs class="elevation-1" :background-color="time === 15 ? '#BBDEFB' : 'white'" @click="time = 15">15
          </g-btn-bs>
          <g-btn-bs class="elevation-1" :background-color="time === 30 ? '#BBDEFB' : 'white'" @click="time = 30">30
          </g-btn-bs>
          <g-btn-bs class="elevation-1" :background-color="time === 45 ? '#BBDEFB' : 'white'" @click="time = 45">45
          </g-btn-bs>
          <g-btn-bs class="elevation-1" :background-color="time === 60 ? '#BBDEFB' : 'white'" @click="time = 60">60
          </g-btn-bs>
        </div>
        <g-btn-bs :disabled="disabledConfirm" block large background-color="#2979FF" @click="confirmOrder">Confirm - {{$t('common.currency', storeLocale)}}{{total | convertMoney}}</g-btn-bs>
      </g-card>
    </g-dialog>
  </div>
</template>

<script>
  import _ from 'lodash'
  import {Touch} from 'pos-vue-framework';
  import {v4 as uuidv4} from 'uuid'

  export default {
    name: "PosOrderDelivery",
    directives: {
      Touch
    },
    props: {
      total: Number,
      items: Array,
      user: Object,
      storeLocale: String,
    },
    filters: {
      convertMoney(value) {
        return !isNaN(value) ? value.toFixed(2) : value
      }
    },
    injectService: ['OrderStore:( selectedCustomer, orderType, createCallInOrder, createCustomer, updateCustomer )', 'PosStore:(isMobile)'],
    data() {
      return {
        favorites: [],
        selectedAddress: 0,
        name: '',
        phone: '',
        address: '',
        zipcode: '',
        street: '',
        house: '',
        city: '',
        dialog: {
          input: false,
          order: false,
        },
        dialogMode: 'add',
        products: [],
        selectedProduct: null,
        modifiers: [],
        type: '',
        note: '',
        time: 30,
        isNewCustomer: false,
        enterPressed: 0,
        apiKey: '',
        autocompleteAddresses: [],
        debouceSearchAddress: () => {},
        token: '',
        placeId: '',
        debouceUpdatePrice: () => {},
        quantity: 1,
      }
    },
    async created() {
      await this.loadProduct()
      this.isNewCustomer = !(this.selectedCustomer && this.selectedCustomer.addresses && this.selectedCustomer.addresses.length > 0)
      window.addEventListener('keydown', this.keyboardHanle.bind(this))
      this.apiKey = (await cms.getModel('PosSetting').findOne())['call']['googleMapApiKey']
      this.debouceSearchAddress = _.debounce(this.searchAddress, 300)
      this.debouceUpdatePrice = _.debounce(this.updatePrice, 300)
    },
    computed: {
      username() {
        return this.user ? this.user.name : ''
      },
      avatar() {
        return this.user ? this.user.avatar : ''
      },
      itemsWithQty() {
        if (this.items) return this.items.filter(i => i.quantity > 0)
        return []
      },
      unavailableToAdd() {
        if (!this.selectedProduct) return true
        if (!this.selectedProduct.choices || this.selectedProduct.choices.length === 0) return false
        for (const choice of this.selectedProduct.choices) {
          if (choice.mandatory) {
            let flag = true
            for (const option of choice.options) {
              const modifiers = this.modifiers
              if (modifiers && modifiers.find(m => m._id === option._id)) {
                flag = false
              }
            }
            if (flag) return true
          }
        }
        return false
      },
      disabledConfirm() {
        return !this.selectedCustomer || _.isEmpty(this.selectedCustomer) || !this.selectedCustomer.name || !this.selectedCustomer.phone || !this.selectedCustomer.addresses || this.selectedCustomer.addresses.length === 0
      }
    },
    methods: {
      async loadProduct() {
        this.products = (await cms.getModel('Product').find({type: 'delivery'})).map(p => ({
          ...p,
          text: `${p.id}. ${p.name}`
        }))
        this.favorites = this.products.filter(p => p.option.favorite)
      },
      back() {
        this.$emit('resetOrderData')
        this.$router.push({
          path: '/pos-dashboard'
        })
        this.selectedCustomer = {}
        this.name = ''
        this.phone = ''
        this.address = ''
        this.house = ''
        this.street = ''
        this.city = ''
        this.placeId = ''
      },
      getRandomColor(i) {
        const colors = ['#FBE4EC', '#84FFFF', '#80D8FF', '#FFF59D', '#B2FF59', '#E1BEE7', '#FFAB91', '#B39DDB', '#BCAAA4', '#1DE9B6']
        return 'background-color: ' + colors[i]
      },
      selectAddress(index) {
        this.selectedAddress = index
      },
      addNewCustomer() {
        if (this.dialogMode === 'add') {
          let customer = {}
          customer.name = this.name
          customer.phone = this.phone
          if (this.selectedCustomer.addresses) {
            customer.addresses = [
              ...this.selectedCustomer.addresses,
              {
                address: this.address,
                zipcode: this.zipcode,
                house: this.house,
                street: this.street,
                city: this.city
              }
            ]
          } else {
            customer.addresses = [{
                address: this.address,
                zipcode: this.zipcode,
                house: this.house,
                street: this.street,
                city: this.city
              }]
          }
          this.$set(this, 'selectedCustomer', customer)
          this.selectedAddress = customer.addresses.length - 1
          this.isNewCustomer = false
        }
        if (this.dialogMode === 'edit') {
          this.$set(this.selectedCustomer, 'name', this.name)
          this.selectedCustomer.addresses.splice(this.selectedAddress, 1, {
                address: this.address,
                zipcode: this.zipcode,
                house: this.house,
                street: this.street,
                city: this.city
          })
        }
        this.address = ''
        this.zipcode = ''
        this.house = ''
        this.street = ''
        this.city = ''
        this.dialog.input = false
      },
      isItemDiscounted(item) {
        return item.originalPrice !== item.price
      },
      addItem(item) {
        this.$emit('addItemQuantity', item)
      },
      removeItem(item) {
        this.$emit('removeItemQuantity', item)
      },
      removeModifier(item, index) {
        this.$emit('removeProductModifier', item, index)
      },
      selectOption(choice, option) {
        const modifiers = _.cloneDeep(this.modifiers) || []
        const index = modifiers.findIndex(m => m._id === option._id)
        if (choice.select === 'one') {
          if (index > -1) {
            modifiers.splice(index, 1)
          } else {
            let otherOptions = modifiers.filter(m => choice.options.map(o => o._id).includes(m._id))
            if (otherOptions.length > 0) {
              for (const opt of otherOptions) {
                const optionIndex = modifiers.findIndex(m => m._id === opt._id)
                modifiers.splice(optionIndex, 1)
              }
            }
            modifiers.push(option)
          }
        } else {
          if (index > -1) {
            modifiers.splice(index, 1)
          } else {
            modifiers.push(option)
          }
        }
        this.$set(this, 'modifiers', modifiers)
      },
      isModifierSelect(option) {
        if (!this.modifiers) return false
        const index = this.modifiers.findIndex(m => m._id === option._id)
        return index > -1
      },
      addProduct() {
        if(!this.selectedProduct) return
        const product = {
          ...this.selectedProduct,
          modifiers: this.modifiers,
          quantity: 1,
        }
        this.$emit('addProductToOrder', product)
        this.selectedProduct = null
        this.modifiers = []
        //focus product autocomplete
        document.querySelector('.g-autocomplete input').click()
      },
      openDialog(mode, address, zipcode, index) {
        if (mode === 'add') {
          this.name = this.selectedCustomer.name || ''
          this.phone = this.selectedCustomer.phone || ''
          this.address = ''
          this.zipcode = ''
          this.house = ''
          this.street = ''
          this.city = ''
        }
        if (mode === 'edit') {
          this.name = this.selectedCustomer.name || ''
          this.address = address
          this.zipcode = zipcode
          this.selectedAddress = index
        }
        this.dialogMode = mode
        this.dialog.input = true
      },
      removeAddress(index) {
        if(this.selectedCustomer.addresses.length === 1) {
          this.isNewCustomer = true
        }
        this.selectedCustomer.addresses.splice(index, 1)
      },
      closeDialogConfirm() {
        this.note = ''
        this.time = 30
        this.dialog.order = false
      },
      async confirmOrder() {
        if (!this.selectedCustomer._id) {
          await this.createCustomer(this.selectedCustomer)
        } else {
          await this.updateCustomer(this.selectedCustomer._id, {
            name: this.selectedCustomer.name,
            addresses: this.selectedCustomer.addresses,
            phone: this.selectedCustomer.phone,
          })
        }
        const customer = {
          name: this.selectedCustomer.name,
          address: this.selectedCustomer.addresses[this.selectedAddress].address,
          phone: this.selectedCustomer.phone,
          zipCode: this.selectedCustomer.addresses[this.selectedAddress].zipcode
        }
        await this.createCallInOrder(customer, this.time, this.note)
        this.$router.push({
          path: '/pos-dashboard'
        })
      },
      chooseProduct(e) {

      },
      keyboardHanle(event) {
        event.stopPropagation()
        if(event.key === 'p') {
          event.preventDefault()
          document.querySelector('.g-autocomplete input').click()
        }
        if (event.key === 'Enter') {
          if (this.enterPressed === 0) {
            const tf = document.querySelector('.quantity input')
            tf && tf.focus()
            this.enterPressed++
            return
          }
          if (this.enterPressed === 1) {
            this.addProduct()
            this.enterPressed = 0
          }
        }
      },
      async searchAddress(text) {
        if(!text) return
        this.token = uuidv4()
        cms.socket.emit('searchPlace', text, this.token, this.apiKey, places => {
          this.autocompleteAddresses = places.map(p => ({
            text: p.description,
            value: p.place_id,
          }))
        })
      },
      async selectAutocompleteAddress(place_id) {
        cms.socket.emit('getPlaceDetail', place_id, this.token, this.apiKey, data => {
          if(!data && _.isEmpty(data)) return
          for(const component of data.address_components) {
            if (component.types.includes('street_number')) {
              this.house = component.long_name
            }
            if (component.types.includes('route')) {
              this.street = component.long_name
            }
            if (component.types.includes('postal_code')) {
              this.zipcode = component.long_name
            }
            if (component.types.includes('locality')) {
              this.city = component.long_name
            }
          }
          this.address = data.name
        })
      },
      async updatePrice(price) {
        const index = this.products.findIndex(p => p._id === this.selectedProduct._id)
        await cms.getModel('Product').findOneAndUpdate({
          _id: this.selectedProduct._id
        }, {
          price
        })
        await this.loadProduct()
        this.selectedProduct = this.products[index]
      },
      selectFavoriteProduct(product) {
        this.$emit('addProductToOrder', {
          ...product,
          modifiers: [],
          quantity: 1,
        })
      }
    },
    async activated() {
      await this.loadProduct()
      this.isNewCustomer = !(this.selectedCustomer && this.selectedCustomer.addresses && this.selectedCustomer.addresses.length > 0)
      this.name = this.selectedCustomer.name
      this.phone = this.selectedCustomer.phone
      this.type = 'default'
      if (this.$router.currentRoute.query && this.$router.currentRoute.query.type) {
        this.type = this.$router.currentRoute.query.type
      }
      this.note = ''
      this.time = 30
    }
  }
</script>

<style scoped lang="scss">
  .delivery {
    display: flex;
    width: 100%;
    height: 100vh;

    @mixin card {
      flex: 1 1 0;
      padding: 8px;
    }

    &-info {
      @include card;
      z-index: 2;
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);

      &__title {
        font-size: 13px;
        font-weight: bold;
        margin-bottom: 8px;
        margin-top: 16px;
      }

      &__favorite {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 8px;

        &-item {
          padding: 8px;
          font-size: 15px;
          font-weight: bold;
          height: 36px;
          border-radius: 4px;
          text-align: center;
        }
      }

      &__customer {
        display: flex;
        flex-direction: column;
        align-items: center;

        &-address {
          width: 100%;
          border-radius: 4px;
          border: 1px solid #E1E1E1;
          box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.2);
          padding: 0 8px 8px;
          margin: 12px 0;
        }
      }
    }

    &-order {
      @include card;
      background-color: #FBFBFB;
      box-shadow: 2px 0 4px rgba(0, 0, 0, 0.25);
      z-index: 1;
      display: flex;
      flex-direction: column;

      &__content {
        flex: 1;
        overflow: auto;
      }

      ::v-deep .bs-tf-wrapper {

        .bs-tf-input-group, .bs-tf-inner-input-group, .bs-tf-input {
          background-color: white;
        }
      }

      &__choice {
        margin-top: 16px;
        padding: 0 4px;

        &-title {
          font-size: 15px;
        }
      }

      &__options {
        display: flex;
        flex-wrap: wrap;
      }

      &__option {
        padding: 8px;
        font-size: 14px;
        font-weight: bold;
        text-align: center;
        background: #F0F0F0;
        border: 1px solid #C9C9C9;
        border-radius: 2px;
        margin-right: 8px;
        margin-top: 8px;

        &--selected {
          background-color: #2979FF;
          border-color: #2979FF;
          color: white;
        }
      }
    }

    &-detail {
      @include card;
      display: flex;
      flex-direction: column;

      &__info {
        display: flex;
        margin-bottom: 4px;
        align-items: center;

        &-username {
          font-weight: bold;
          font-size: 13px;
          margin-left: 8px;
        }
      }

      &__total {
        font-size: 18px;
        font-weight: bold;
        color: #FF4552;
      }

      &__order {
        border-radius: 8px;
        border: 1px solid #e8e8e8;
        overflow: scroll;
        margin-bottom: 16px;
        flex: 1;

        .item {
          padding: 8px;

          &:nth-child(even) {
            background-color: #f8f8f8;
          }

          &-detail {
            display: flex;
            justify-content: space-between;

            &__name {
              font-weight: 700;
              font-size: 14px;
            }

            &__price {
              font-size: 12px;
              color: #616161;
              margin-right: 4px;

              &--new {
                font-size: 14px;
                color: #ff5252;
                margin-right: 4px;
              }
            }

            &__discount {
              text-decoration: line-through;
            }

            &__option {
              font-size: 12px;
              font-style: italic;
              font-weight: 700;
            }
          }

          &-action {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            flex-basis: 25%;

            .g-icon {
              cursor: pointer;
              color: #1d1d26;
              -webkit-tap-highlight-color: transparent;
            }
          }
        }
      }
    }
  }

  .dialog {
    padding: 24px;

    &-icon--close {
      position: absolute;
      top: 16px;
      right: 16px;
    }
  }
</style>
