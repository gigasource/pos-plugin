<template>
  <div class="delivery">
    <div class="delivery-info">
      <div class="delivery-info--upper">
        <template v-if="deliveryOrderMode === 'tablet' || !showKeyboard">
          <div class="delivery-info__favorite">
            <div :style="getRandomColor(i)" class="delivery-info__favorite-item" v-for="(f, i) in favorites"
                 @click="selectFavoriteProduct(f)"
                 :key="`favorite_${i}`">
              {{f.name}}
            </div>
          </div>
        </template>
        <div class="delivery-info__customer">
          <template v-if="!isNewCustomer">
            <div
                :class="['delivery-info__customer-address', selectedAddress === i && 'delivery-info__customer-address--selected']"
                v-for="(item, i) in selectedCustomer.addresses" @click="selectAddress(i)">
              <div class="row-flex align-items-center">
                <g-radio small v-model="selectedAddress" :value="i" :label="`Address ${i+1}`" color="#536DFE"/>
                <g-spacer/>
                <g-btn-bs small style="margin: 0 2px; padding: 4px;" background-color="#F9A825"
                          @click="openDialog('edit', item.address, item.zipcode, i)">
                  <g-icon size="15">icon-reservation_modify</g-icon>
                </g-btn-bs>
                <g-btn-bs small style="margin: 0 2px; padding: 4px;" background-color="#FF4452"
                          @click="removeAddress(i)">
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
            <template v-if="deliveryOrderMode === 'mobile'">
              <div class="row-flex mt-3 w-100">
                <div style="flex: 1; margin-right: 2px">
                  <g-text-field outlined dense v-model="phone" label="Phone" @click="showKeyboard = true" :virtual-event="isIOS"/>
                </div>
                <div style="flex: 1; margin-left: 2px">
                  <g-text-field outlined dense v-model="name" label="Name" @click="showKeyboard = true" :virtual-event="isIOS"/>
                </div>
              </div>
              <div class="row-flex">
                <div class="col-9">
                  <g-combobox style="width: 100%" label="Address" v-model="placeId" outlined dense clearable :virtual-event="isIOS" skip-search
                              :items="autocompleteAddresses" @update:searchText="debouceSearchAddress" ref="autocomplete"
                              @input-click="showKeyboard = true" keep-menu-on-blur menu-class="menu-autocomplete-address"
                              @input="selectAutocompleteAddress"/>
                </div>
                <div class="flex-grow-1 ml-1">
                  <g-text-field outlined dense v-model="house" label="Nr" @click="showKeyboard = true" :virtual-event="isIOS"/>
                </div>
              </div>
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
            </template>
          </template>
        </div>
      </div>
      <div class="delivery-info--lower">
        <div :class="['delivery-info__call', calls && calls[0] && calls[0].type === 'missed' ? 'b-red' : 'b-grey']"
             v-if="calls && calls.length > 0">
          <div class="delivery-info__call--info">
            <p class="fw-700 fs-small">
              <g-icon size="16" class="mr-1">icon-call</g-icon>
              {{calls[0].customer.phone}}
            </p>
            <p class="fs-small text-grey-darken-1">{{calls[0].customer.name}}</p>
          </div>
          <div :class="['delivery-info__call-btn', orderType === 'pickup' && 'delivery-info__call-btn--selected']"
               @click="chooseCustomer('pickup')">
            <g-icon size="20">icon-take-away</g-icon>
          </div>
          <div :class="['delivery-info__call-btn', orderType === 'delivery' && 'delivery-info__call-btn--selected']"
               @click="chooseCustomer('delivery')">
            <g-icon size="20">icon-delivery-scooter</g-icon>
          </div>
          <div class="delivery-info__call-btn--cancel" @click="deleteCall()">
            <g-icon color="white">clear</g-icon>
          </div>
        </div>
        <template v-else>
          <div class="delivery-info__call--empty">
            <p class="fw-700">Empty</p>
            <p class="text-grey-darken-1">No pending calls</p>
          </div>
          <g-menu v-model="menuMissed" v-if="missedCalls && missedCalls.length > 0" top left nudge-top="5">
            <template v-slot:activator="{on}">
              <div v-on="on"
                   :class="['delivery-info__call--missed', menuMissed && 'delivery-info__call--missed--selected']">
                <b>Missed</b>
                <div class="delivery-info__call--missed-num">
                  {{missedCalls.length}}
                </div>
              </div>
            </template>
            <div class="menu-missed">
              <div class="menu-missed__call" v-for="(call, i) in missedCalls" :key="`missed_${i}`">
                <div class="menu-missed__call--info">
                  <p class="fw-700 fs-small">
                    <g-icon size="16" class="mr-1">icon-call</g-icon>
                    {{call.customer.phone}}
                  </p>
                  <p class="fs-small text-grey-darken-1">{{call.customer.name}}</p>
                </div>
                <div :class="['delivery-info__call-btn']"
                     @click="chooseMissedCustomer(i, 'pickup')">
                  <g-icon size="20">icon-take-away</g-icon>
                </div>
                <div :class="['delivery-info__call-btn']"
                     @click="chooseMissedCustomer(i, 'delivery')">
                  <g-icon size="20">icon-delivery-scooter</g-icon>
                </div>
                <div class="delivery-info__call-btn--cancel" @click="deleteCall(i)">
                  <g-icon color="white">clear</g-icon>
                </div>
              </div>
            </div>
          </g-menu>
        </template>
      </div>
    </div>
    <div class="delivery-order">
      <template v-if="deliveryOrderMode === 'mobile'">
        <g-spacer/>
        <pos-order-delivery-keyboard mode="active" :keyboard-config="keyboardConfig" @submit="chooseProduct"/>
      </template>
      <template v-else>
        <div class="delivery-order__content">
          <g-autocomplete text-field-component="GTextFieldBs" v-model="selectedProduct" :items="products"
                          @input="chooseProduct" ref="autocomplete" :filter="(itemText, text) => {
                          return itemText.toLowerCase().includes(text.toLowerCase())
                        }"
                          return-object/>
          <g-text-field-bs v-if="selectedProduct" class="bs-tf__pos quantity" v-model="quantity" label="Quantity"/>
          <g-text-field-bs v-if="selectedProduct" class="bs-tf__pos" :value="selectedProduct.price" label="Price"
                           @input="debouceUpdatePrice"/>
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
        <g-btn-bs block large  class="elevation-2" icon="icon-kitchen" background-color="#0EA76F"
                  :disabled="unavailableToAdd" @click="addProduct">Add to order list
        </g-btn-bs>
      </template>
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
      <g-btn-bs block large class="elevation-2" icon="icon-print" background-color="#2979FF"
                @click="dialog.order = true">Send to
        kitchen
      </g-btn-bs>
    </div>
    <dialog-form-input v-model="dialog.input" @submit="addNewCustomer">
      <template #input>
        <div class="row-flex flex-wrap justify-around">
          <pos-textfield-new style="width: 48%" label="Name" v-model="name"/>
          <pos-textfield-new style="width: 48%" label="Phone" v-model="phone"/>
          <g-combobox style="width: 98%" label="Address" v-model="placeId" clearable :virtual-event="isIOS" skip-search
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
          <b>Address: </b> {{this.selectedCustomer.addresses && this.selectedCustomer.addresses.length > 0 &&
          this.selectedCustomer.addresses[this.selectedAddress].address}}
          {{this.selectedCustomer.addresses && this.selectedCustomer.addresses.length > 0 &&
          this.selectedCustomer.addresses[this.selectedAddress].zipcode}}
        </div>
        <g-text-field-bs label="Delivery note:" v-model="note">
          <template v-slot:append-inner>
            <g-icon @click="dialog.note = true">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
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
        <g-btn-bs :disabled="disabledConfirm" block large background-color="#2979FF" @click="confirmOrder">Confirm -
          {{$t('common.currency', storeLocale)}}{{total | convertMoney}}
        </g-btn-bs>
      </g-card>
    </g-dialog>
    <g-dialog v-model="dialog.choice" eager width="500">
      <g-card class="dialog r">
        <g-icon class="dialog-icon--close" @click="dialog.choice = false" size="20">icon-close</g-icon>
        <div class="dialog-title">Select options</div>
        <div v-if="selectedProduct && selectedProduct.choices" class="dialog-content" :key="dialog.choice">
          <div class="dialog-content__choice" v-for="(choice, index) in selectedProduct.choices" :key="index">
            <div class="dialog-content__choice-name">
              <span class="fw-700">{{choice.name}}</span>
              <span class="text-red ml-1">{{choice.mandatory ? '*' : ''}}</span>
            </div>
            <div class="dialog-content__choice-option">
              <template v-if="choice.select === 'one' && choice.mandatory">
                <g-radio-group v-model="modifiers[index]">
                  <g-radio v-for="option in choice.options" :key="option._id" color="#536DFE" :value="option"
                           :label="`${option.name} (${$t('common.currency', storeLocale)}${formatMoney(option.price)})`"/>
                </g-radio-group>
              </template>
              <template v-else>
                <g-checkbox v-for="option in choice.options" :key="option._id"
                            v-model="modifiers[index]"
                            color="#536DFE"
                            :value="option"
                            :label="getCheckboxLabel(option)"/>
              </template>
            </div>
          </div>
        </div>
        <div class="dialog-action">
          <div class="row-flex align-items-center" style="line-height: 2">
            <g-icon @click.stop="changeQuantity(-1)" color="#424242" size="28">remove_circle_outline</g-icon>
            <span style="margin-left: 4px; margin-right: 4px; min-width: 20px; text-align: center">{{quantity}}</span>
            <g-icon @click.stop="changeQuantity(1)" color="#424242" size="28">add_circle</g-icon>
          </div>
          <g-spacer/>
          <g-btn-bs min-width="80" height="100%" text-color="#424242" @click="dialog.choice = false">Cancel</g-btn-bs>
          <g-btn-bs width="80" height="100%" rounded text-color="#FFFFFF" background-color="#536DFE"
                    :disabled="unavailableToAdd" @click="addProduct">OK
          </g-btn-bs>
        </div>
      </g-card>
    </g-dialog>
    <dialog-text-filter v-model="dialog.note" label="Delivery note" @submit="e => { note = e }"/>
    <div v-if="showKeyboard" class="keyboard">
      <div class="keyboard-overlay" @click="hideKeyboard"></div>
      <div class="keyboard-wrapper">
        <pos-keyboard-full type="alpha-number" @enter-pressed="submitCustomer"/>
      </div>
    </div>
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
    injectService: ['OrderStore:( selectedCustomer, orderType, createCallInOrder, createCustomer, updateCustomer, calls, missedCalls )', 'PosStore:isIOS'],
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
          choice: false,
          note: false,
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
        autocompleteAddresses: [],
        debouceSearchAddress: () => {
        },
        token: '',
        placeId: '',
        debouceUpdatePrice: () => {
        },
        quantity: 1,
        showKeyboard: false,
        keyboardConfig: [],
        menuMissed: false,
        missedIndex: null,
        deliveryOrderMode: 'tablet'
      }
    },
    async created() {
      await this.loadProduct()
      await this.loadKeyboard()
      this.isNewCustomer = !(this.selectedCustomer && this.selectedCustomer.addresses && this.selectedCustomer.addresses.length > 0)
      this.debouceSearchAddress = _.debounce(this.searchAddress, 300)
      this.debouceUpdatePrice = _.debounce(this.updatePrice, 300)
      const setting = await cms.getModel('PosSetting').findOne()
      this.deliveryOrderMode = setting['generalSetting'].deliveryOrderMode || 'tablet'
      if(this.deliveryOrderMode === 'tablet') {
        window.addEventListener('keydown', this.keyboardHanle.bind(this))
      }
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
      },
    },
    methods: {
      async loadProduct() {
        this.products = (await cms.getModel('Product').find({type: 'delivery'})).map(p => ({
          ...p,
          text: `${p.id}. ${p.name}`
        }))
        this.favorites = this.products.filter(p => p.option.favorite)
      },
      async loadKeyboard() {
        const setting = await cms.getModel('PosSetting').findOne()
        this.keyboardConfig = setting && setting['keyboardDeliveryConfig']
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
        if (!this.selectedProduct) return
        const product = {
          ...this.selectedProduct,
          modifiers: this.modifiers,
          quantity: this.quantity || 1,
        }
        this.$emit('addProductToOrder', product)
        this.selectedProduct = null
        this.modifiers = []
        this.quantity = 1
        //focus product autocomplete
        if (!this.isMobile)
          document.querySelector('.g-autocomplete input').click()
        this.dialog.choice = false
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
        if (this.selectedCustomer.addresses.length === 1) {
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
        this.dialog.order = false
        this.autocompleteAddresses = []
        this.$router.push({
          path: '/pos-dashboard'
        })
      },
      chooseProduct(productString) {
        let [productId, quantity] = productString.split(' x ')
        if (!productId) return
        if (!quantity) quantity = 1
        const product = this.products.find(p => p.id.toLowerCase() === productId.toLowerCase())
        if (product) {
          if (product.choices && product.choices.length > 0) {
            this.quantity = +quantity
            this.selectedProduct = product
            this.dialog.choice = true
          } else {
            this.$emit('addProductToOrder', {
              ...product,
              quantity,
              modifiers: []
            })
          }
        }
      },
      keyboardHanle(event) {
        event.stopPropagation()
        if (event.key === 'p') {
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
        if (!text || text.length < 4) return
        this.token = uuidv4()
        cms.socket.emit('searchPlace', text, this.token, places => {
          this.autocompleteAddresses = places.map(p => ({
            text: p.description,
            value: p.place_id,
          }))
        })
      },
      async selectAutocompleteAddress(place_id) {
        if (this.autocompleteAddresses.find(item => item.value === place_id)) {
          cms.socket.emit('getPlaceDetail', place_id, this.token, data => {
            if (!_.isEmpty(data)) {
              for (const component of data.address_components) {
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
            }
          })
        }
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
      },
      getCheckboxLabel(option) {
        if (!option.price)
          return option.name
        return `${option.name} (${$t('common.currency', this.storeLocale)}${this.formatMoney(option.price)})`
      },
      formatMoney(value) {
        return !isNaN(value) && value > 0 ? value.toFixed(2) : value
      },
      changeQuantity(value) {
        if (this.quantity + value >= 0) {
          this.quantity += value
        }
      },
      submitCustomer() {
        if (this.name && this.phone && this.placeId && this.autocompleteAddresses.find(item => item.value === this.placeId) && this.house) {
          //get exact address + zip code
          this.token = uuidv4()
          cms.socket.emit('getZipcode', `${this.street} ${this.house} ${this.city}`, this.token, (address, zipcode) => {
              this.address = address
              this.zipcode = zipcode
          })
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
        this.hideKeyboard()
      },
      deleteCall(index) {
        //index => missed call || first call
        if (index) {
          this.missedCalls.splice(index, 1)
        } else {
          this.calls.splice(0, 1)
        }
      },
      chooseCustomer(type) {
        this.orderType = type
        this.selectedCustomer = this.calls[0].customer
        this.isNewCustomer = !(this.selectedCustomer && this.selectedCustomer.addresses && this.selectedCustomer.addresses.length > 0)
        this.name = this.selectedCustomer.name === 'New customer' ? '' : this.selectedCustomer.name
        this.phone = this.selectedCustomer.phone
      },
      chooseMissedCustomer(index, type) {
        this.orderType = type
        const call = {
          ...this.missedCalls[index],
          type: 'missed'
        }
        this.calls.unshift(call)
        this.missedCalls.splice(index, 1)
        this.selectedCustomer = call.customer
        this.isNewCustomer = !(this.selectedCustomer && this.selectedCustomer.addresses && this.selectedCustomer.addresses.length > 0)
        this.name = this.selectedCustomer.name === 'New customer' ? '' : this.selectedCustomer.name
        this.phone = this.selectedCustomer.phone
      },
      hideKeyboard() {
        this.showKeyboard = false
        const autocomplete = this.$refs.autocomplete
        if(autocomplete) {
          const menu = autocomplete.$refs && autocomplete.$refs.menu
          if(menu) {
            menu.isActive = false
          }
        }
      }
    },
    async activated() {
      await this.loadProduct()
      await this.loadKeyboard()
      this.isNewCustomer = !(this.selectedCustomer && this.selectedCustomer.addresses && this.selectedCustomer.addresses.length > 0)
      this.name = this.selectedCustomer.name === 'New customer' ? '' : this.selectedCustomer.name
      this.phone = this.selectedCustomer.phone
      this.type = 'default'
      if (this.$router.currentRoute.query && this.$router.currentRoute.query.type) {
        this.type = this.$router.currentRoute.query.type
      }
      this.note = ''
      this.time = 30
      const setting = (await cms.getModel('PosSetting').findOne())
      this.deliveryOrderMode = setting['generalSetting'].deliveryOrderMode || 'tablet'
      if(this.deliveryOrderMode === 'tablet') {
        window.addEventListener('keydown', this.keyboardHanle.bind(this))
      }
    },
    watch: {
      zipcode(val) {
        if(val && this.selectedCustomer && this.selectedCustomer.addresses) {
          this.selectedCustomer.addresses[this.selectedAddress].zipcode = val
        }
      },
      address(val) {
        if(val && this.selectedCustomer && this.selectedCustomer.addresses) {
          this.selectedCustomer.addresses[this.selectedAddress].address = val
        }
      }
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
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;

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

      ::v-deep .g-tf-wrapper {
        margin: 4px 0 8px;

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

      &--upper {
        flex: 1;
        overflow: auto;
      }

      &--lower {
        margin-top: 8px;
        display: flex;
        align-items: stretch;
      }

      &__call {
        display: flex;
        align-items: center;
        flex: 1;
        padding: 6px;
        background: #FFFFFF;
        border-width: 0.4px;
        border-style: solid;
        border-radius: 4px;

        &--info {
          flex: 1;
          line-height: 1.2;
        }

        &-btn {
          padding: 7px;
          border: 1px solid #E0E0E0;
          border-radius: 2px;
          cursor: pointer;
          margin-right: 4px;
          line-height: 1;

          &--selected {
            background-color: #E3F2FD;
            border-color: #1271FF;
          }

          &--cancel {
            width: 36px;
            height: 36px;
            padding: 6px;
            background: #FF4552;
            border-radius: 2px;
            cursor: pointer;
            line-height: 1;
          }
        }

        &--empty {
          padding: 6px;
          flex: 1;
          border-radius: 4px;
          background: #FFFFFF;
          border: 0.4px solid #9E9E9E;
          margin-right: 8px;
          line-height: 1.2;
          font-size: 14px;
        }

        &--missed {
          display: flex;
          align-items: center;
          background-color: white;
          border: 1px solid #FF4452;
          color: #FF4452;
          border-radius: 4px;
          height: 46px;
          padding: 4px;

          &--selected {
            background-color: #FFEBEE;
          }

          &-num {
            width: 20px;
            height: 20px;
            margin-left: 2px;
            border-radius: 50%;
            text-align: center;
            font-size: 14px;
            color: white;
            background-color: #FF4552;
            display: flex;
            align-items: center;
            justify-content: center;
          }
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
    padding: 12px;

    &-icon--close {
      position: absolute;
      top: 16px;
      right: 16px;
    }

    &-title {
      font-weight: 600;
    }

    &-content {
      font-size: 13px;
      overflow-y: auto;
      scrollbar-width: none; // firefox
      -ms-overflow-style: none; //edge
      padding-bottom: 12px;

      &::-webkit-scrollbar {
        display: none;
      }

      &__choice {
        padding: 6px 0;

        &-name {
          margin-bottom: 4px;
        }

        &-option {
          display: flex;
          flex-wrap: wrap;
          align-items: center;

          .g-radio-wrapper,
          .g-checkbox-wrapper {
            margin: 4px 44px 4px 0;

            ::v-deep .g-radio,
            ::v-deep .g-checkbox {
              padding-left: 20px;
            }

            ::v-deep .g-radio-label,
            ::v-deep .g-checkbox-label {
              color: #424242;
              font-size: 15px;
              text-transform: capitalize;
              margin-left: 0;
            }

            ::v-deep .g-radio .g-radio-checkmark:before,
            ::v-deep .g-checkbox .g-checkbox-checkmark:before {
              font-size: 16px;
            }
          }

          ::v-deep .radio-group {
            display: flex;
            flex-wrap: wrap;
          }
        }
      }

      &__note {
        .bs-tf-wrapper {
          margin: 8px 2px;

          ::v-deep .bs-tf-inner-input-group,
          ::v-deep .bs-tf-input {
            background: #fafafa;
            width: 100%;

            .bs-tf-input::placeholder {
              font-size: 12px;
              color: #9e9e9e;
            }
          }
        }
      }
    }

    &-action {
      display: flex;
      background: #efefef;
      margin: 0 -12px -12px;
      padding: 6px;
      border-radius: 0 0 4px 4px;
    }
  }

  .menu-missed {
    background: #FFFFFF;
    box-shadow: 1px 1px 6px rgba(0, 0, 0, 0.08);
    border-radius: 4px;
    width: calc(33vw - 16px);

    &__call {
      display: flex;
      align-items: center;
      flex: 1;
      padding: 6px;
      background: #FFFFFF;
      border-bottom: 0.4px solid #9E9E9E;

      &--info {
        flex: 1;
        line-height: 1.2;
        margin-right: 4px;
      }
    }
  }

  .keyboard {
    position: fixed;
    left: 33%;
    bottom: 0;
    right: 0;
    top: 0;
    z-index: 10;
    display: flex;
    flex-direction: column;

    &-overlay {
      flex: 1;
      background: rgba(21, 21, 21, 0.42);
    }

    &-wrapper {
      background: #F0F0F0;
      padding: 4px;
    }

    ::v-deep .key {
      transition: none;

      &.waves-ripple {
        background-color: rgba(255, 190, 92, 1)
      }

      &.key-enter {
        font-size: 16px !important;
      }
    }
  }
</style>

<style lang="scss">
  .menu-autocomplete-address {
    .g-list {
      .g-list-item-content {
        padding-right: 4px;

        .g-list-item-text {
          white-space: normal;
          word-break: break-word;
          line-height: 1.35;
        }
      }

      & > div:not(:last-child) .g-list-item-text {
        border-bottom: 1px solid #F0F0F0;
      }
    }
  }
</style>
