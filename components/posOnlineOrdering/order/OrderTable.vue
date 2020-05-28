<template>
  <div>
    <div class="po-order-table">
      <div  class="po-order-table__header">
        <!-- header image -->
        <img :src="cdnOrderHeaderImage || '/plugins/pos-plugin/assets/images/header.png'" class="po-order-table__header__image"/>
      </div>
      <div class="po-order-table__main">
        <!-- header text -->
        <div class="po-order-table__header__text">
          <g-icon class="po-order-table__header__icon--mobile" @click="gotoPrevPageMobile">arrow_back</g-icon>
          <g-icon class="po-order-table__header__icon" v-if="showBackArrowInHeader" color="#424242" @click="gotoPrevPage" size="20">arrow_back_ios</g-icon>
          <div class="po-order-table__header__text--main">{{ headerTextMain }}</div>
          <div class="po-order-table__header__total" v-if="orderView">{{$t('store.totalItems')}}: {{ totalItems }}</div>
        </div>

        <!-- content -->
        <div id="table-content" class="po-order-table__content">
          <template v-if="!isOpening">
            <div class="message-closed">
              <div class="message-closed__title">{{$t('store.merchantClose')}}</div>
              <div class="message-closed__message">{{ merchantMessage }}</div>
            </div>
          </template>
          <template v-else>
            <!-- 0 items -->
            <div v-if="orderView && noMenuItem" style="margin-top: 100px; display: flex; align-items: center; justify-content: center; flex-direction: column">
              <img src="/plugins/pos-plugin/assets/empty_order2.svg" style="max-width: 120px">
              <div style="margin-top: 10px; font-size: 15px; text-align: center; color: #616161;">
                {{$t('store.emptyCart')}}
              </div>
            </div>

            <!-- > 0 items -->
            <div v-if="orderView && hasMenuItem"
                 v-for="(item, index) in orderItems" :key="index"
                 class="po-order-table__item">
              <p>
                <g-icon @click.stop="removeItem(item)" color="#424242" size="24">remove_circle_outline</g-icon>
                <span class="po-order-table__item__name ta-center" style="display: inline-block; min-width: 20px">{{item.quantity}}</span>
                <g-icon @click.stop="addItem(item)" color="#424242" size="24">add_circle</g-icon>
                <span class="po-order-table__item__name ml-2">{{ item.name }}</span>
                <span v-if="item.modifiers && item.modifiers.length > 0" class="po-order-table__item__modifier ml-1">- {{getItemModifiers(item)}}</span>
              </p>
              <div class="po-order-table__item__note">
                <textarea :id="`item_note_${index}`" rows="1" :placeholder="`${$t('store.note')}...`" v-model="item.note"/>
                <div class="po-order-table__item__price">{{ getItemPrice(item) | currency }}</div>
              </div>

            </div>

            <!-- Confirm -->
            <template v-if="confirmView">
              <div class="section-header">{{$t('store.contactInfo')}}</div>
              <g-radio-group v-model="orderType" row class="radio-option">
                <g-radio small color="#1271ff" :label="$t('store.pickup')" value="pickup" :disabled="!store.pickup"/>
                <g-radio small color="#1271ff" :label="$t('store.delivery')" value="delivery" :disabled="!store.delivery"/>
              </g-radio-group>
              <span v-if="orderType === 'delivery' && !satisfyMinimumValue && store.minimumOrderValue && store.minimumOrderValue.active"
                    style="color: #4CAF50; font-size: 15px">
                {{$t('store.minimumWarning')}}{{$t('common.currency')}}{{store.minimumOrderValue.value}}.
              </span>
              <span v-if="orderType === 'delivery' && !satisfyDeliveryTime" style="color: #4CAF50; font-size: 15px">
                {{$t('store.deliveryTimeWarning')}}{{deliveryTimeString}}
              </span>
              <div class="section-form">
                <g-text-field v-model="customer.name" :label="$t('store.name')" required clearable clear-icon="icon-cancel@16" prepend-icon="icon-person@16"/>
                <g-text-field v-model="customer.company" :label="$t('store.company')" clearable clear-icon="icon-cancel@16" prepend-icon="icon-company@16"/>
                <g-text-field type="number" v-model="customer.phone" :label="$t('store.telephone')" required clearable clear-icon="icon-cancel@16" prepend-icon="icon-phone2@16"/>
                <template v-if="orderType === 'pickup'">
                  <g-select v-model="deliveryTime" :items="deliveryTimeList" prepend-icon="icon-delivery-truck@16" :label="$t('store.pickupTime')" required/>
                </template>
                <template v-if="orderType === 'delivery'">
                  <g-text-field v-model="customer.address" :label="$t('store.address')" required clearable clear-icon="icon-cancel@16" prepend-icon="icon-place@16"/>
                  <g-text-field :rules="validateZipcode" type="number" v-model="customer.zipCode" :label="$t('store.zipCode')" required clearable clear-icon="icon-cancel@16" prepend-icon="icon-zip-code@16"/>
                  <g-select v-model="deliveryTime" :items="deliveryTimeList" prepend-icon="icon-delivery-truck@16" :label="$t('store.deliveryTime')" required/>
<!--                  <g-time-picker-input v-model="customer.deliveryTime" label="Delivery time" required prepend-icon="icon-delivery-truck@16"/>-->
                </template>
                <div>
                  <div v-if="!couponTf.active" @click="couponTf.active = true"><u>{{$t('store.applyCode')}}</u></div>
                  <g-text-field-bs v-if="couponTf.active" :placeholder="$t('store.couponCode')" :suffix="$t('store.apply')" @click:append-outer="applyCoupon" @input="clearCouponValidate" v-model="couponTf.value"/>
                  <div class="error-message">{{couponTf.error}}</div>
                  <div v-if="couponTf.success" class="i text-green row-flex align-items-center fs-small-2">
                    <g-icon size="12" color="green">check</g-icon>
                    {{$t('store.couponApplied')}}
                  </div>
                </div>
                <g-textarea v-model="customer.note" :placeholder="`${$t('store.note')}...`" rows="3" no-resize/>
              </div>
            </template>
            
            <!-- Payment view -->
            <template v-if="paymentView">
              <div class="section-header">Payment</div>
              <div v-for="(item, index) in orderItems" :key="index" class="order-item-detail">
                <div class="order-item-detail__index" >{{ item.quantity || 1}}</div>
                <div class="order-item-detail__name">
                  {{ item.name }}
                  <span v-if="item.modifiers && item.modifiers.length > 0" class="po-order-table__item__modifier">- {{getItemModifiers(item)}}</span>
                </div>
                <div class="pl-1">{{ getItemPrice(item) | currency }}</div>
              </div>
              <div class="order-item-summary">
                <span>{{$t('store.total')}}: <b>{{ totalItems }}</b> {{$t('store.items')}}</span>
                <g-spacer/>
                <span>{{ totalPrice | currency }}</span>
              </div>
              <div class="order-item-summary" >
                <span>{{$t('store.shippingFee')}}:</span>
                <g-spacer/>
                <span>{{ shippingFee | currency }}</span>
              </div>
              <div class="order-item-summary" v-for="{name, coupon, value} in discounts">
                <span>{{coupon ? `Coupon (${coupon})` : `${name}`}}:</span>
                <g-spacer/>
                <span>-{{ value | currency }}</span>
              </div>
  
              <!-- PAYMENT -->
              <div class="section-header">PAYMENT OPTIONS</div>
              <div style="margin: 0 auto;">
                <div class="pay-by-cash-btn" @click="confirmCashPayment">Pay by Cash</div>
                <pay-pal-smart-button
                    v-if="isPaymentViaPayPalEnable"
                    :self-host="true"
                    :debug="true"
                    :order-info="paypalOrderInfo"
                    :client-id="store.paypalClientId"
                    :currency="currencyCode"
                    @onApprove="confirmPayPalPayment"/>
              </div>
            </template>
          </template>
        </div>
      </div>
      <!-- footer -->
      <g-spacer/>
      <template v-if="view !== 'payment'">
        <div :class="['po-order-table__footer', !isOpening && 'disabled']">
          <div>{{$t('store.total')}}: <span style="font-weight: 700; font-size: 18px; margin-left: 4px">{{ effectiveTotal | currency }}</span></div>
          <g-spacer/>
          <g-btn-bs v-if="orderView" width="154" rounded background-color="#2979FF" @click="view = 'confirm'" :disabled="!allowConfirmView" large style="position: relative; justify-content: flex-start">
            {{$t('store.payment')}}
            <div class="icon-payment">
              <g-icon size="16" color="white" class="ml-1">fas fa-chevron-right</g-icon>
            </div>
          </g-btn-bs>
          <g-btn-bs v-if="confirmView" width="154" :disabled="unavailableConfirm" rounded background-color="#2979FF" @click="view = 'payment'" elevation="5" large >{{$t('store.confirm')}}</g-btn-bs>
        </div>
        <div class="po-order-table__footer--mobile" v-if="orderItems.length > 0">
          <g-badge :value="true" color="#4CAF50" overlay>
            <template v-slot:badge>
              {{totalItems}}
            </template>
            <div style="width: 40px; height: 40px; background-color: #ff5252; border-radius: 8px; display: flex; align-items: center; justify-content: center">
              <g-icon>icon-menu2</g-icon>
            </div>
          </g-badge>
          <div class="po-order-table__footer--mobile--total">{{effectiveTotal | currency}}</div>
          <g-spacer/>
          <g-btn-bs v-if="orderView" width="150" rounded background-color="#2979FF" @click="view = 'confirm'" style="padding: 8px 16px">{{$t('store.payment')}}</g-btn-bs>
          <g-btn-bs v-if="confirmView" width="150" :disabled="unavailableConfirm" rounded background-color="#2979FF" @click="view = 'payment'" elevation="5" style="padding: 8px 16px" >{{$t('store.confirm')}}</g-btn-bs>
        </div>
      </template>
    </div>

    <!-- Order created -->
    <order-created v-if="dialog.value" v-model="dialog.value"
                   :order="dialog.order" :phone="store.phone" :timeout="store.orderTimeOut"
                   :get-item-modifier="getItemModifiers" :get-item-price="getItemPrice"
                   @close="closeOrderCreatedDialog"/>
    <dialog-order-confirm v-model="dialog.confirm"
                          :items="orderItems"
                          :total-items="totalItems"
                          :total-price="totalPrice"
                          :shipping-fee="shippingFee"
                          :discounts="discounts"
                          :effective-total="effectiveTotal"
                          @confirm="confirmPayment"/>
  </div>
</template>

<script>
  import _ from 'lodash'
  import OrderCreated from './OrderCreated';
  import orderUtil from '../../logic/orderUtil';
  import { get12HourValue, get24HourValue, incrementTime } from '../../logic/timeUtil';
  import { autoResizeTextarea } from '../../logic/commonUtils'
  import { getCdnUrl } from '../../Store/utils';
  import DialogOrderConfirm from './dialogOrderConfirm';
  import PayPalSmartButton from './PayPalSmartButton';

  export default {
    name: 'OrderTable',
    components: {DialogOrderConfirm, OrderCreated, PayPalSmartButton },
    props: {
      store: Object,
      isOpening: Boolean,
      merchantMessage: String,
      orderItems: Array,
      totalPrice: Number,
      totalItems: Number
    },
    data() {
      return {
        view: 'order',
        orderType: this.store.delivery ? 'delivery' : 'pickup', // delivery || pick-up
        paymentType: 'cash', // cash || paypal
        customer: {
          name: '',
          company: '',
          phone: '',
          address: '',
          zipCode: '',
          deliveryTime: '',
          note: ''
        },
        dialog: {
          value: false,
          order: {},
          confirm: false,
        },
        couponTf: {
          active: false,
          error: '',
          value: '',
          success: false
        },
        couponCode: '',
        confirming: false,
        listDiscounts: [],
        storeOpenHours: null,
        deliveryTime: null,
        addressSuggestions: [],
        addressStr: '',
        addressNo: '',
        throttledGetSuggestions: null,
        paypalOrderDetail: {}
      }
    },
    filters: {
      currency(value) {
        if (value != null)
          return $t('common.currency') + value.toFixed(2)
        return 0
      }
    },
    async created() {
      this.listDiscounts = await cms.getModel('Discount').find({store: this.store._id})

      this.deliveryTime = this.asap

      const {openHours} = this.store
      this.storeOpenHours = openHours.filter(({dayInWeeks}) => {
        let today = new Date().getDay()
        today -= 1
        if (today === -1) today = 6

        return dayInWeeks[today]
      })

      // get geocode & distance from address & zipCode
      this.$watch(vm => [vm.customer.address, vm.customer.zipCode], this.getGeocode)
    },
    computed: {
      currency() {
        return $t('common.currency')
      },
      currencyCode() {
        return $t('common.currencyCode')
      },
      asap() {
        return $t('common.asap')
      },
      orderView() { return this.view === 'order' },
      confirmView() { return this.view === 'confirm'},
      paymentView() { return this.view === 'payment' },
      allowConfirmView() {
        return this.orderItems.length
      },
      satisfyMinimumValue() {
        return this.store.minimumOrderValue && this.store.minimumOrderValue.active
          ? this.totalPrice >= this.store.minimumOrderValue.value
          : true
      },
      satisfyDeliveryTime() {
        let result = false, now = dayjs().format('HH:mm'), inWorkingTime = false, havingDeliveryTime = false
        this.storeOpenHours.forEach(({deliveryStart, deliveryEnd, openTime, closeTime}) => {
          if(deliveryStart && deliveryEnd) havingDeliveryTime = true
          if(now >= deliveryStart && now <= deliveryEnd) result = true
          if(now >= openTime && now <= closeTime) inWorkingTime = true
        })
        if(!havingDeliveryTime) result = inWorkingTime
        return result
      },
      deliveryTimeString() {
        let formatTime = (this.store.country && this.store.country.name === 'United States') ? get12HourValue : get24HourValue
        return this.storeOpenHours.map(oh => oh.deliveryStart && oh.deliveryEnd ? `${formatTime(oh.deliveryStart)} - ${formatTime(oh.deliveryEnd)}` : `${formatTime(oh.openTime)} - ${formatTime(oh.closeTime)}`).join(' and ')
      },
      noMenuItem() { return !this.hasMenuItem },
      hasMenuItem() { return this.orderItems.length > 0 },
      storeZipCodes() {
        return this.store.deliveryFee.fees.map(({ zipCode, fee }) => {
          if (zipCode.includes(',') || zipCode.includes(';')) {
            zipCode = zipCode.replace(/\s/g, '')
            zipCode = zipCode.includes(',') ? zipCode.split(',') : zipCode.split(';')
          }
          return zipCode instanceof Array ? zipCode.map(code => ({ zipCode: code, fee })) : { zipCode, fee }
        }).flat()
      },
      shippingFee() {
        if (!this.orderItems || this.orderItems.length === 0)
          return 0;

        if (this.orderType === 'pickup' || this.orderType === 'pickup' || !this.store.deliveryFee)
          return 0

        // calculate zip code from store setting
        for (const deliveryFee of this.storeZipCodes) {
         if (_.lowerCase(_.trim(deliveryFee.zipCode)) === _.lowerCase(_.trim(this.customer.zipCode)))
           return deliveryFee.fee
        }

        // other zip code will get default fee if store accept order from another zip code
        if (this.store.deliveryFee && this.store.deliveryFee.acceptOrderInOtherZipCodes)
          return this.store.deliveryFee.defaultFee

        return 0
      },
      unavailableConfirm() {
        const check = !this.customer.name || !this.customer.phone || isNaN(this.customer.phone)
        if (this.orderType === 'delivery') {
          if (!this.satisfyMinimumValue) return true
          for (const fn of this.validateZipcode) {
            if (typeof fn === 'function' && typeof fn(this.customer.zipCode) === 'string') {
              return true
            }
          }
          return check || !this.customer.address || !this.customer.zipCode || this.customer.zipCode.length < 5
        }
        return check
      },
      validateZipcode() {
        const rules = []
        if (this.store.deliveryFee && !this.store.deliveryFee.acceptOrderInOtherZipCodes) {
          const zipCodes = this.store.deliveryFee.fees.map(({ zipCode }) => {
            if (zipCode.includes(',') || zipCode.includes(';')) {
              zipCode = zipCode.replace(/\s/g, '')
              zipCode = zipCode.includes(',') ? zipCode.split(',') : zipCode.split(';')
            }
            return zipCode;
          }).flat()
          rules.push((val) => val.length < 5 || zipCodes.includes(val) || 'Shipping service is not available to your zip code!')
        }
        return rules
      },
      discounts() {
        this.couponTf.success = false
        let discounts = _.cloneDeep(this.listDiscounts)
        discounts = discounts.filter(discount => {
          return discount.type.includes(this.orderType) && discount.enabled
        })
        if (!discounts.length) return discounts

        const applicableDiscounts = discounts.filter(({ conditions: { coupon, daysOfWeek, timePeriod, total, zipCode } }) => {
          if (coupon) {
            if (!this.couponCode) return false
            if (coupon.toLowerCase() !== this.couponCode.toLowerCase()) {
              if(this.couponTf.error === '' && !this.couponTf.success) this.couponTf.error = this.$t('store.invalidCoupon')
              return false
            }
            this.couponTf.error = this.$t('store.notApplicable')
          }
          if (total && total.min && this.totalPrice < total.min) return false
          if (total && total.max && this.totalPrice > total.max) return false
          if (timePeriod) {
            if (dayjs().isBefore(dayjs(timePeriod.startDate)) || dayjs().isAfter(dayjs(timePeriod.endDate))) {
              return false
            }
          }
          if (daysOfWeek && daysOfWeek.length) {
            if (!daysOfWeek.includes(dayjs().format('dddd'))) return false
          }
          if (zipCode && zipCode.length) {
            if (this.orderType !== 'delivery' || !zipCode.includes(this.customer.zipCode)) return false
          }

          if(coupon && this.couponCode && coupon.toLowerCase() === this.couponCode.toLowerCase()) {
            this.couponTf.success = true
            this.couponTf.error = ''
          }
          return true
        })

        return applicableDiscounts.map(({ amount, name, conditions: {coupon} }) => {
          let value
          if (amount.type === 'flat') value = amount.value
          else if (amount.type === 'percent') value = amount.value * this.totalPrice / 100
          else value = this.shippingFee

          return {
            name,
            value,
            coupon,
            type: amount.type
          }
        })
      },
      totalDiscount() {
        return this.discounts.reduce((total, {value}) => total + value, 0)
      },
      effectiveTotal() {
        if (!this.orderItems || !this.orderItems.length) return 0
        switch (this.view) {
          case 'order': return this.totalPrice;
          case 'confirm':
          case 'payment':
            const total = this.totalPrice + this.shippingFee - this.totalDiscount;
            return total < 0 ? 0 : total
        }
      },
      deliveryTimeList() {
        let list = []
        const today = new Date()
        const {hour: baseHour, minute: baseMinute} = incrementTime(today.getHours(), today.getMinutes(), 15)

        if (this.storeOpenHours) {
          this.storeOpenHours.forEach(({openTime, closeTime, deliveryStart, deliveryEnd}) => {
            const start = deliveryStart ? deliveryStart : openTime, end = deliveryEnd ? deliveryEnd : closeTime
            let [openTimeHour, openTimeMinute] = get24HourValue(start).split(':')
            let [closeTimeHour, closeTimeMinute] = get24HourValue(end).split(':')

            openTimeHour = parseInt(openTimeHour)
            openTimeMinute = parseInt(openTimeMinute)
            closeTimeHour = parseInt(closeTimeHour)
            closeTimeMinute = parseInt(closeTimeMinute)

            if (isNaN(openTimeHour) || isNaN(openTimeMinute) || isNaN(closeTimeHour) || isNaN(closeTimeMinute)) return

            while (openTimeHour < closeTimeHour || (openTimeHour === closeTimeHour && openTimeMinute <= closeTimeMinute)) {
              if (openTimeHour > baseHour || (openTimeHour === baseHour && openTimeMinute >= baseMinute))
                list.push(`${openTimeHour}:${openTimeMinute.toString().length === 1 ? '0' + openTimeMinute : openTimeMinute}`)

              const newTime = incrementTime(openTimeHour, openTimeMinute, this.store.deliveryTimeInterval || 15)
              openTimeHour = newTime.hour
              openTimeMinute = newTime.minute
            }
          })
        }

        list = _.uniq(list).sort()
        list.unshift(this.asap)

        return list
      },
      cdnOrderHeaderImage() {
        return this.store.orderHeaderImageSrc && `${getCdnUrl(this.store.orderHeaderImageSrc)}?w=680&h=390`
      },
      availableStreetAutocomplete() {
        return this.addressSuggestions.length > 0
      },
      paypalOrderInfo() {
        if (!this.store.paypalClientId)
          return
        
        // this.totalPrice + this.shippingFee - this.totalDiscount;
        
        return {
          application_context: {
            brand_name: this.store.name,
            locale: $t('common.locale'),   // using custom locale instead of paypal user locale
            landing_page: "NO_PREFERENCE", // let paypal decide whether login page or billing page will be display depend on user login condition
            shipping_preference: "NO_SHIPPING", // hide shipping information in paypal order
            user_action: "CONTINUE"
          },
          purchase_units: [{
            custom_id: `${this.store._id}`, // using custom_id as an identity to identify which store this transaction belong too
            amount: {
              currency_code: this.currencyCode,
              value: `${this.effectiveTotal.toFixed(2)}`,
              breakdown: {
                item_total: {
                  currency_code: this.currencyCode,
                  value: `${this.totalPrice.toFixed(2)}`
                },
                discount: {
                  currency_code: this.currencyCode,
                  value: `${this.totalDiscount.toFixed(2)}`
                },
                shipping: {
                  currency_code: this.currencyCode,
                  value: `${this.shippingFee.toFixed(2)}`
                }
              }
            },
            items: _.map(this.orderItems, item => ({
              name: item.name,
              description: item.desc || '',
              unit_amount: {
                currency_code: this.currencyCode,
                value: `${item.price}`
              },
              quantity: `${item.quantity}`,
              category: "PHYSICAL_GOODS"
            })),
          }]
        }
      },
      headerTextMain() {
        switch(this.view) {
          case 'order': return $t('store.orderList');
          case 'confirm': return $t('store.confirmOrder');
          case 'payment': return 'Payment'; // TODO: i18n
        }
      },
      showBackArrowInHeader() {
        switch (this.view) {
          case 'order': return false;
          case 'confirm': return true;
          case 'payment': return true;
        }
      },
      isPaymentViaPayPalEnable() {
        return this.store.paymentProviders && this.store.paymentProviders.paypal && this.store.paymentProviders.paypal.enable
      }
    },
    watch: {
      confirmView(val) {
        this.$emit('confirm-view', val)
        const wrapper = document.getElementById('table-content')
        wrapper && wrapper.scroll({top: 0})
        if(!val) {
          this.$nextTick(() => {
            autoResizeTextarea('.po-order-table__item__note textarea')
          })
        }
      }
    },
    methods: {
      // event handler when user click to back button in order table (for desktop view)
      gotoPrevPage() {
        switch (this.view) {
          case 'order':
            return;
          case 'confirm':
            this.view = 'order';
            break;
          case 'payment':
            this.view = 'confirm';
            break;
        }
      },
      // event handler when user tap to back button in order table (for mobile view)
      gotoPrevPageMobile() {
        switch (this.view) {
          case 'order':
            this.$emit('back')
            break;
          case 'confirm':
            this.view = 'order';
            break;
          case 'payment':
            this.view = 'confirm';
            break;
        }
      },
      removeItem(item) {
        this.$emit('decrease', item)
      },
      addItem(item) {
        this.$emit('increase', Object.assign({}, item, {quantity: 1}))
      },
      async confirmPayPalPayment(orderDetails) {
        this.paypalOrderDetail = orderDetails
        this.paymentType = 'paypal'
        await this.confirmPayment();
      },
      async confirmCashPayment() {
        this.paymentType = 'cash'
        await this.confirmPayment();
      },
      
      async confirmPayment() {
        if (this.unavailableConfirm || this.confirming) return

        this.confirming = true

        const {note, ...customer} = this.customer;

        let products = _.map(this.orderItems, orderItem => {
          return {
            ..._.omit(orderItem, ['_id', 'category', 'groupPrinters']),
            groupPrinter: orderItem.groupPrinters[0],
            groupPrinter2: this.store.useMultiplePrinters && orderItem.groupPrinters.length >= 2 && orderItem.groupPrinters[1],
            category: orderItem.category.name,
            originalPrice: orderItem.price,
            modifiers: orderItem.modifiers,
            note: orderItem.note
          }
        })

        if (this.discounts && this.discounts.length) {
          const discount = _.reduce(this.discounts.filter(i => i.type !== 'freeShipping'), (acc, { value }) => {
            return acc + value
          }, 0);
          const value = this.totalPrice - discount

          products = orderUtil.applyDiscountForOrder(products, { difference: discount, value })
        }

        // an identifier for an order
        const generateOrderTokenResponse = await axios.get(`${location.origin}/store/order-token`)
        const orderToken = generateOrderTokenResponse.data.token

        const createdDate = new Date();
        const orderData = {
          orderType: this.orderType,
          paymentType: this.paymentType,
          paypalOrderDetail: this.paypalOrderDetail,
          customer,
          products,
          note,
          createdDate,
          ...this.store.orderTimeOut && { timeoutDate: dayjs(createdDate).add(this.store.orderTimeOut, 'minute').toDate() },
          shippingFee: this.discounts.some(item => item.type === 'freeShipping') ? 0 : this.shippingFee,
          totalPrice: this.totalPrice,
          takeOut: true,
          orderToken,
          deliveryTime: this.deliveryTime === this.asap ? 'asap' : this.deliveryTime,
          discounts: this.discounts,
        }

        if (!this.store.useMultiplePrinters) {
          Object.assign(orderData, {printers: [this.store.printers[0]]})
        }

        window.cms.socket.emit('createOrder', this.store._id, orderData)

        this.dialog.order = {
          orderToken: orderToken,
          items: this.orderItems,
          shippingFee: this.shippingFee,
          totalPrice: this.totalPrice,
          status: 'inProgress',
          discounts: this.discounts,
          effectiveTotal: this.effectiveTotal
        }

        this.dialog.value = true
      },
      closeOrderCreatedDialog() {
        this.customer = {
          name: '',
          company: '',
          phone: '',
          address: '',
          zipCode: '',
          deliveryTime: '',
          note: ''
        }

        this.confirming = false
        this.couponCode = ''
        this.couponTf = {
          active: false,
          error: '',
          value: '',
          success: false
        }

        this.deliveryTime = this.asap

        this.$emit('clear')
        this.view = 'order'
        this.$emit('back') // for mobile
      },
      applyCoupon() {
        this.couponTf.error = ''
        this.couponCode = this.couponTf.value
      },
      clearCouponValidate() {
        this.couponCode = ''
        this.couponTf.error = ''
        this.couponTf.success = false
      },
      getItemPrice(item) {
        return item.price + _.sumBy(item.modifiers, modifier => modifier.price * modifier.quantity)
      },
      getItemModifiers(item) {
        return item.modifiers.map(m => m.name).join(', ')
      },
      async getSuggestions(text) {
        if (!text) return []

        let url = `https://pelias.gigasource.io/v1/autocomplete?layers=street&text=${encodeURI(text)}`

        try {
          const { data: {features} } = await axios.get(url)
          this.addressSuggestions = features.map(feature => {
            const { name } = feature.properties // street name
            return `${name}`
          })
        } catch (e) {
          console.warn(e)
        }
      },
      getGeocode: _.debounce(async function (values) {
        const [address, zipCode] = values
        if (!address || !zipCode) return

        let url = `https://pelias.gigasource.io/v1/search?text=${encodeURI(address)}`
        if (this.store.coordinates) {
          const {lat, long} = this.store.coordinates
          url += `&focus.point.lat=${lat}&focus.point.lon=${long}`
        }

        try {
          const { data: {features} } = await axios.get(url)
          if (features && features.length) {
            const foundLocation = features.find(location => location.properties.postalcode === zipCode)
            if (foundLocation) {
              // todo get distance
              const { properties: { distance }, geometry: { coordinates } } = foundLocation
              console.log(`Coords: ${coordinates}, Distance: ${distance}`)
            }
          }
        } catch (e) {
          console.warn(e)
        }
      })
    }
  }
</script>
<style scoped lang="scss">
  .po-order-table {
    position: relative;
    width: 340px;
    height: 100vh;
    background-color: #F8F8F8;
    display: flex;
    flex-direction: column;

    &__main {
      padding: 0 20px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    &__header {
      &__image {
        width: 340px;
        height: 180px;
        margin-bottom: 20px;
      }

      &__text {
        display: flex;
        align-items: center;
        padding-bottom: 4px;
        margin-bottom: 4px;
        font-size: 18px;
        font-weight: 700;
        border-bottom: 1px solid #D8D8D8;

        &--main {
          display: flex;
          flex: 1;
          font-size: 20px;
        }
      }

      &__icon--mobile {
        display: none;
      }

      &__total {
        font-size: 15px;
        font-weight: 400;
      }
    }

    &__content {
      flex: 1;
      overflow: auto;
      scrollbar-width: none; // firefox
      -ms-overflow-style: none; //edge

      &::-webkit-scrollbar {
        display: none;
      }

      .radio-option {
        padding-top: 20px;
        text-align: center;

        .g-radio-wrapper {
          margin-right: 40px;
          margin-left: 20px;

          ::v-deep .g-radio-label {
            font-weight: 600;
          }
        }
      }

      .section-header {
        padding-top: 20px;
        font-weight: 700;
      }

      .section-form {
        .g-textarea  {
          border: 1px solid #EFEFEF;
          border-radius: 4px;
          background-color: #fff;
          padding: 8px;

          ::v-deep .g-tf {
            &:before, &:after {
              display: none;
            }
          }

          ::v-deep .g-tf-append__inner {
            display: none;
          }
        }

        .g-textarea ::v-deep textarea,
        .g-tf-wrapper ::v-deep input {
          user-select: text !important;
        }

        .bs-tf-wrapper {
          margin: 0;
          width: 100%;

          ::v-deep .bs-tf-input-group,
          ::v-deep .bs-tf-input-text {
            background: white;
          }

          ::v-deep .bs-tf-input-group {
            border-color: #efefef
          }

          ::v-deep .bs-tf-input-text {
            font-weight: 600;
            font-size: 15px;
            color: #000000;
            cursor: pointer;
            padding: 6px;

            &:hover {
              background: #EFEFEF;
              color: #536DFE;
            }
          }

          ::v-deep .bs-tf-inner-input-group__active {
            box-shadow: none;
            border-color: #efefef !important;
          }

          ::v-deep .bs-tf-input {
            color: rgba(0, 0, 0, 0.87);
            width: 100%;
          }
        }
      }

      .order-item-detail {
        display: flex;
        flex-direction: row;
        border-bottom: 1px solid #D8D8D8;
        padding-top: 5px;
        padding-bottom: 5px;

        &__index {
          width: 20px;
          height: 20px;
          line-height: 20px;
          font-style: normal;
          font-weight: bold;
          font-size: 13px;
          margin-right: 10px;
          background-color: #424242;
          box-shadow: 2px 0px 5px rgba(0, 0, 0, 0.1398);
          color: #FFF;
          text-align: center;
          border-radius: 50%;
        }

        &__name {
          font-style: normal;
          font-weight: bold;
          font-size: 15px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }
      }

      .order-item-summary {
        @extend .order-item-detail;
        border-bottom: 1px solid transparent;

        &--end {
          margin-bottom: 100px;
        }
      }

      .message-closed {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-top: 150px;

        &__title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 16px;
          text-align: center;
        }

        &__message {
          color: #424242;
          font-size: 15px;
          text-align: center;
        }
      }
    }

    &__item {
      align-items: center;
      width: 100%;
      min-height: 64px;
      border-bottom: 1px dashed #d8d8d8;
      padding: 10px 0;

      &__name {
        font-weight: bold;
        font-size: 15px;
        word-break: break-word;

        &.collapse {
          -webkit-line-clamp: 2;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      }

      &__modifier {
        font-size: 12px;
        font-weight: 600;
        color: #424242;
        text-transform: capitalize;
      }

      &__price {
        font-weight: bold;
        font-size: 15px;
        line-height: 19px;
        margin-right: 8px;
      }

      &__note {
        margin-top: 8px;
        display: flex;

        textarea {
          flex: 1;
          outline: none;
          border: none;
          resize: none;
          background: transparent;
          font-size: 12px;
          color: #9E9E9E;
          font-style: italic;
          overflow-y: hidden;
          min-height: 19px;
          margin-right: 8px;
        }
      }

      &__action {
        flex: 0 0 20%;
        display: flex;
        justify-content: space-between;
        align-items: center;

        & > span {
          min-width: 20px;
          text-align: center;
        }
      }
    }

    &__footer {
      min-height: 80px;
      border-radius: 0 25px 0 0;
      display: flex;
      align-items: center;
      background-color: #E9E9E9;
      width: 100%;
      padding-left: 16px;
      padding-right: 8px;
      font-size: 15px;

      .g-btn-bs {
        padding: 8px 18px;
      }

      &--mobile {
        display: none;
      }
    }


  }
  .order-created {
    width: 464px;
    height: 363px;
    padding: 30px;
    border-radius: 5px;
    margin: 0 auto;

    &--mobile {
      display: none;
    }
  }
  .pay-by-cash-btn {
    background-color: #2979ff;
    color: #FFF;
    width: 100%;
    border-radius: 20px;
    height: 40px;
    text-align: center;
    line-height: 40px;
    margin-top: 15px;
    margin-bottom: 15px;
    max-width: 750px;
    
    &:hover {
      filter: brightness(85%);
    }
  }
  
  @media screen and (max-width: 1139px) {
    .po-order-table {
      background: #FFF;

      &__main {
        padding: 0;
        height: calc(100% - 72px);
        background: #F2F2F2;
      }

      &__header {
        display: none;

        &__text {
          padding: 16px;
          font-size: 16px;
          background-color: white;
          box-shadow: 1px 0px 3px rgba(0, 0, 0, 0.2);

          &--main {
            justify-content: center;
            font-size: 15px;
          }
        }

        &__icon {
          display: none;

          &--mobile {
            display: inline-flex;
            color: #000;
          }
        }

        &__total {
          display: none;
        }
      }

      &__content {
        margin-top: 16px;
        margin-bottom: 0;
        background-color: white;
        padding: 0 16px;
        height: calc(100% - 50px);

        &::-webkit-scrollbar {
          display: none;
        }
      }

      &__footer {
        display: none;

        &--mobile {
          display: flex;
          position: fixed;
          bottom: 0;
          width: 100%;
          border-top-right-radius: 32px;
          background-color: white;
          box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25);
          padding: 16px 24px;
          z-index: 20;

          &--total {
            font-size: 18px;
            font-weight: 700;
            align-self: center;
            margin-left: 16px;
          }
        }
      }
    }

    .dlg-order-created {
      display: none;
    }
    .order-created {
      display: none;

      &--mobile {
        position: absolute;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: column;
        width: 100vw;
        height: 100vh;
      }
    }
    ::v-deep {
      .cpn-order-created {
        &__body {
          padding-left: 40px;
          padding-right: 40px;
        }

        &__actions {
          box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.25);
          padding: 20px;
          border-radius: 0 25px 0 0;
        }
      }
    }
  }

  .icon-payment {
    position: absolute;
    width: 33px;
    height: 33px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.15);
    right: 4px;
    top: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .error-message {
    display: block;
    font-size: 80%;
    font-weight: 400;
    margin-top: 2px;
    color: red;
  }
</style>

<style lang="scss">
  .g-icon {
    -webkit-tap-highlight-color: transparent;
  }

  textarea {
    user-select: text !important;
  }

  input {
    user-select: text !important;
    margin: 0;

    &:-webkit-autofill,
    &:-webkit-autofill:hover,
    &:-webkit-autofill:focus,
    &:-webkit-autofill:active {
      animation: autofill 0s forwards !important;
    }

    @keyframes autofill {
      100% {
        background: transparent;
        color: inherit;
      }
    }

    @-webkit-keyframes autofill {
      100% {
        background: transparent;
        color: inherit;
      }
    }

    &[type=number] {
      -moz-appearance: textfield;
      outline: none;
      user-select: text;

      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
    }
  }

  .g-btn-bs {
    position: relative;

    &:hover:before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.12);
    }
  }
</style>
