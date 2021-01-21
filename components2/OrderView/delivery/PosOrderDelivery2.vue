<script>
import {Touch} from "pos-vue-framework";
import _ from "lodash";
import {$filters, avatar, isIOS, isMobile, username} from "../../AppSharedStates";
import {computed, withModifiers, ref} from "vue";
import {useRouter} from 'vue-router';
import {v4 as uuidv4} from "uuid";
import {isItemDiscounted} from "../pos-ui-shared";
import {useI18n} from "vue-i18n";
import {
  autocompleteAddresses,
  deliveryOrderMode,
  favorites,
  openDialog,
  selectedAddress,
  selectedCustomer,
  showKeyboard,
  dialog
} from "./delivery-shared";

import cms from 'cms'
import { deliveryCustomerUiFactory } from './delivery-customer-ui'
import { genScopeId } from '../../utils';

export default {
  name: "PosOrderDelivery2",
  directives: {
    Touch
  },
  setup() {
    const {t, locale} = useI18n();

    const products = ref([])
    const selectedProduct = ref()
    const modifiers = ref([])
    const type = ref('')
    const note = ref('')
    const time = ref(30)

    const enterPressed = ref(0)
    const token = ref('')

    const quantity = ref(1)
    const keyboardConfig = ref([])
    const paymentTotal = ref(0)
    // TODO: Refactor
    const currentOrder = ref({ items: [], hasOrderWideDiscount: false, firstInit: false })
    const user = ref({})


    let debounceUpdatePrice, keyboardEventHandler
    const autocomplete = ref();

    async function created() {
      //fixme refactor here
      await loadProduct()
      await loadKeyboard()
      debounceUpdatePrice = _.debounce(updatePrice, 300)
      const setting = await cms.getModel('PosSetting').findOne()
      deliveryOrderMode.value = setting['generalSetting'].deliveryOrderMode || 'tablet'
      keyboardEventHandler = keyboardHandler;
      if (deliveryOrderMode.value === 'tablet') {
        window.addEventListener('keydown', keyboardEventHandler, false)
      }
    }

    created();

    const itemsWithQty = computed(() => {
      if (currentOrder.value && currentOrder.value.items)
        return currentOrder.value.items.filter(i => i.quantity > 0)
      return []
    });


    const unavailableToAdd = computed(() => {
      if (!selectedProduct.value) return true
      if (!selectedProduct.value.choices || selectedProduct.value.choices.length === 0) return false
      for (const choice of selectedProduct.value.choices) {
        if (choice.mandatory) {
          let flag = true
          for (const option of choice.options) {
            const modifiers = modifiers.value
            if (modifiers && modifiers.find(m => m._id === option._id)) {
              flag = false
            }
          }
          if (flag) return true
        }
      }
      return false
    })

    const disabledConfirm = computed(() => {
      return !selectedCustomer.value || _.isEmpty(selectedCustomer.value) || !selectedCustomer.value.name || !selectedCustomer.value.phone || !selectedCustomer.value.addresses || selectedCustomer.value.addresses.length === 0
    })

    async function loadProduct() {
      products.value = (await cms.getModel('Product').find({type: 'delivery'})).map(p => ({
        ...p,
        text: `${p.id}. ${p.name}`
      }))
      favorites.value = products.value.filter(p => p.option.favorite)
    }

    async function loadKeyboard() {
      const setting = await cms.getModel('PosSetting').findOne()
      keyboardConfig.value = setting && setting['keyboardDeliveryConfig']
    }

    const router = useRouter();

    function back() {
      resetOrderData()
      router.push({
        path: '/pos-dashboard'
      })
      selectedCustomer.value = {}
      name.value = ''
      phone.value = ''
      address.value = ''
      house.value = ''
      street.value = ''
      city.value = ''
      placeId.value = ''
    }

    function addItem(item) {
      //fixme: refactore
    }

    function removeItem(item) {
      //fixme: refactore
    }

    function removeModifier(item, index) {
      //fixme: refactore
    }

    function selectOption(choice, option) {
      const _modifiers = _.cloneDeep(modifiers.value) || []
      const index = _modifiers.findIndex(m => m._id === option._id)
      if (choice.select === 'one') {
        if (index > -1) {
          _modifiers.splice(index, 1)
        } else {
          let otherOptions = _modifiers.filter(m => choice.options.map(o => o._id).includes(m._id))
          if (otherOptions.length > 0) {
            for (const opt of otherOptions) {
              const optionIndex = _modifiers.findIndex(m => m._id === opt._id)
              _modifiers.splice(optionIndex, 1)
            }
          }
          _modifiers.push(option)
        }
      } else {
        if (index > -1) {
          _modifiers.splice(index, 1)
        } else {
          _modifiers.push(option)
        }
      }
      modifiers.value = _modifiers
    }

    function isModifierSelect(option) {
      if (!modifiers.value) return false
      const index = modifiers.value.findIndex(m => m._id === option._id)
      return index > -1
    }

    function addProduct() {
      if (!selectedProduct.value) return

      const product = {
        ...selectedProduct.value,
        modifiers: modifiers.value,
        quantity: quantity.value || 1,
      }

      //refactore
      addProductToOrder(product)
      selectedProduct.value = null
      modifiers.value = []
      quantity.value = 1
      //focus product autocomplete
      if (!isMobile.value)
        document.querySelector('.g-autocomplete input').click()
      dialog.value.choice = false
    }

    function closeDialogConfirm() {
      note.value = ''
      time.value = 30
      dialog.value.order = false
    }

    async function confirmOrder() {
      if (!selectedCustomer.value._id) {
        //todo: factory
        await createCustomer(selectedCustomer.value)
      } else {
        await updateCustomer(selectedCustomer.value._id, {
          name: selectedCustomer.value.name,
          addresses: selectedCustomer.value.addresses,
          phone: selectedCustomer.value.phone,
        })
      }
      const customer = {
        name: selectedCustomer.value.name,
        address: selectedCustomer.value.addresses[selectedAddress.value].address,
        phone: selectedCustomer.value.phone,
        zipCode: selectedCustomer.value.addresses[selectedAddress.value].zipcode
      }
      await createCallInOrder(customer, time.value, note.value)
      dialog.value.order = false
      autocompleteAddresses.value = []
      router.push({
        path: '/pos-dashboard'
      })
    }

    function chooseProduct(productString) {
      if (typeof productString === 'string') {
        let [productId, _quantity] = productString.split(' x ')
        if (!productId) return
        if (!_quantity) _quantity = 1
        const product = products.value.find(p => p.id.toLowerCase() === productId.toLowerCase())
        if (product) {
          if (product.choices && product.choices.length > 0) {
            quantity.value = +_quantity
            selectedProduct.value = product
            dialog.value.choice = true
          } else {
            addProductToOrder({
              ...product,
              quantity,
              modifiers: []
            })
          }
        }
      }
    }

    function keyboardHandler(event) {
      event.stopPropagation()
      if (event.key === 'p') {
        const autocomplete = document.querySelector('.g-autocomplete input')
        if (autocomplete !== document.activeElement && document.activeElement.tagName !== 'INPUT') {
          event.preventDefault()
          autocomplete.click()
        }
      }
      if (event.key === 'Enter') {
        if (enterPressed.value === 0) {
          if (autocomplete.value && !selectedProduct.value) {
            const list = autocomplete.value.renderList
            if (list.length === 1) {
              selectedProduct.value = list[0]
            }
          }
          setTimeout(() => {
            const tf = document.querySelector('.quantity input')
            tf && tf.focus()
          }, 200)
          enterPressed.value++
          return
        }
        if (enterPressed.value === 1) {
          addProduct()
          enterPressed.value = 0
        }
      }
    }

    async function updatePrice(price) {
      const index = products.value.findIndex(p => p._id === selectedProduct.value._id)
      await cms.getModel('Product').findOneAndUpdate({
        _id: selectedProduct.value._id
      }, {price})
      loadProduct();
      selectedProduct.value = products.value[index]
    }

    function getCheckboxLabel(option) {
      if (!option.price)
        return option.name
      return `${option.name} (${t('common.currency', locale)}${$filters.formatCurrency(option.price)})`
    }

    function changeQuantity(value) {
      if (quantity.value + value >= 0) {
        quantity.value += value
      }
    }

    function resetOrderData() {
      //fixme: OrderStore:resetOrderData
      console.warn('PosOrderDelivery2:resetOrderData was not implemented')
    }

    function addProductToOrder(product) {
      console.warn('PosOrderDelivery2:addProductToOrder was not implemented')
      //fixme: OrderStore:addProductToOrder
      // the code below is temporary logic to migrate ui
      function genObjectId(id) {
        const BSON = require('bson');
        if (id) return new BSON.ObjectID(id)
        return new BSON.ObjectID();
      }
      function mapProduct(p) {
        return {
          ...p,
          ...!p.originalPrice && { originalPrice: p.price },
          ...!p.quantity && { quantity: 1 },
          ...!p.course && { course: 1 },
          product: p._id,
          _id: genObjectId(),
          taxes: [p.tax, p.tax2]
        }
      }
      currentOrder.value.items.push(mapProduct(product))
    }

    function removeProductModifier() {
      //fixme OrderStore:removeProductModifier
      console.warn('PosOrderDelivery2:removeProductModifier was not implemented')
    }

    function addItemQuantity() {
      //fixme OrderStore:addItemQuantity
      console.warn('PosOrderDelivery2:addItemQuantity was not implemented')
    }

    function removeItemQuantity() {
      //fixme OrderStore:removeItemQuantity
      console.warn('PosOrderDelivery2:removeItemQuantity was not implemented')
    }

    const { customerUiRender, renderDialogs } =  deliveryCustomerUiFactory()
    const renderDeliveryOrder = () => {
      return (
          <div class="delivery-order">
            {(deliveryOrderMode.value === 'mobile') ?
                <>
                  <g-spacer/>
                  <pos-order-delivery-keyboard mode="active" keyboardConfig={keyboardConfig.value}
                                               onSubmit={chooseProduct}/>
                </> :
                <>
                  <div class="delivery-order__content">
                    <g-autocomplete text-field-component="GTextFieldBs" v-model={selectedProduct.value}
                                    items={products.value}
                                    ref="autocomplete" return-object
                                    filter={(itemText, text) => itemText.toLowerCase().includes(text.toLowerCase())}/>
                    {selectedProduct.value && <>
                      <g-text-field-bs class="bs-tf__pos quantity" v-model={quantity.value} label="Quantity"/>
                      <g-text-field-bs class="bs-tf__pos" modelValue={selectedProduct.value.price} label="Price"
                                       onUpdate:modelValue={debounceUpdatePrice}/>
                      <g-text-field-bs class="bs-tf__pos" v-model={selectedProduct.value.note} label="Note"/>
                    </>}
                    {(selectedProduct.value && selectedProduct.value.choices && selectedProduct.value.choices.length > 0) &&
                    selectedProduct.value.choices.map((choice, iC) =>
                        <div class="delivery-order__choice" key={`choice_${iC}`}>
                          <p class="delivery-order__choice-title">
                            {choice.name}
                            {choice.mandatory && <span class="text-red">*</span>}
                          </p>
                          <div class="delivery-order__options">
                            {choice.options.map((option, i0) =>
                                <div key={`option_${iC}_ ${iO}`}
                                     onClick={withModifiers(() => selectOption(choice, option), ['stop'])}
                                     class={['delivery-order__option', isModifierSelect(option) && 'delivery-order__option--selected']}>
                                  {option.name} - {t('common.currency', locale)}{option.price}
                                </div>
                            )}
                          </div>
                        </div>)}
                  </div>
                  <g-btn-bs block large class="elevation-2" icon="icon-kitchen" background-color="#0EA76F"
                            disabled={unavailableToAdd.value} onClick={addProduct}>Add to order list
                  </g-btn-bs>
                </>}
          </div>
      )
    }
    const renderDeliveryDetail = () => {
      return (
          <div class="delivery-detail">
            <div class="delivery-detail__info">
              <g-avatar size="36">
                <img alt src={avatar.value}/>
              </g-avatar>
              <div class="delivery-detail__info-username">{username.value}</div>
              <g-spacer/>
              <g-btn-bs class="elevation-1" onClick={back} style="border-radius: 50%; padding: 6px">
                <g-icon>icon-back</g-icon>
              </g-btn-bs>
              <g-spacer/>
              <div
                  class="delivery-detail__total">{t('common.currency', locale)}{$filters.formatCurrency(paymentTotal)}</div>
            </div>
            <div class="delivery-detail__order">
              {itemsWithQty.value.map((item, i) =>
                  <div key={i} class="item">
                    <div class="item-detail">
                      <div>
                        <p class="item-detail__name">{item.id}. {item.name}</p>
                        <p>
                          <span
                              class={['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']}>{$filters.formatCurrency(item.originalPrice)}</span>
                          {isItemDiscounted(item) &&
                          <span
                              class="item-detail__price--new">{t('common.currency', locale)} {$filters.formatCurrency(item.price)}</span>}
                        </p>
                      </div>
                      <div class="item-action">
                        <g-icon onClick={withModifiers(() => removeItem(item), ['stop'])}>remove_circle_outline</g-icon>
                        <span>{item.quantity}</span>
                        <g-icon onClick={withModifiers(() => addItem(item), ['stop'])}>add_circle_outline</g-icon>
                      </div>
                    </div>
                    {item.modifiers && <div> {item.modifiers.map((modifier, index) =>
                        <div key={`${item._id}_${index}`}>
                          <g-chip label small text-color="#616161" close onClose={() => removeModifier(item, index)}>
                            {modifier.name} | {t('common.currency', locale)}{
                            $filters.formatCurrency(modifier.price)
                          }
                          </g-chip>
                        </div>)}
                    </div>}
                  </div>)}
            </div>
            <g-btn-bs block large class="elevation-2" icon="icon-print" background-color="#2979FF"
                      onClick={() => dialog.value.order = true}>
              Send to kitchen
            </g-btn-bs>
          </div>
      )
    }

    const selectedCustomerAddress = computed(() => {
      if (!selectedCustomer.value || !selectedCustomer.value.addresses || selectedCustomer.value.addresses.length < 1)
        return

      const addressLine = selectedCustomer.value.addresses[selectedAddress.value]
      return `${addressLine.address} ${addressLine.zipcode}`
    })
    const renderOrderDialog = () => {
      return (
          <g-dialog v-model={dialog.value.order} width="500" eager>
            <g-card class="dialog r">
              <g-icon class="dialog-icon--close" onClick={closeDialogConfirm} size="20">icon-close</g-icon>
              <div class="mx-2">
                <b>Name: </b> {selectedCustomer.value && selectedCustomer.value.name}
              </div>
              <div class="mx-2">
                <b>Phone: </b> {selectedCustomer.value && selectedCustomer.value.phone}
              </div>
              <div class="mx-2">
                <b>Address: </b> {selectedCustomerAddress.value}
              </div>
              <g-text-field-bs label="Delivery note:" v-model={note.value}>
                {{
                  'append-inner': () => <g-icon onClick={() => dialog.value.note = true}>icon-keyboard</g-icon>
                }}
              </g-text-field-bs>
              <div class="ma-2">Time to complete (minute)</div>
              <div class="mb-3">
                <g-btn-bs class="elevation-1" backgroundColor={time.value === 15 ? '#BBDEFB' : 'white'}
                          onClick={() => time.value = 15}>15
                </g-btn-bs>
                <g-btn-bs class="elevation-1" backgroundColor={time.value === 30 ? '#BBDEFB' : 'white'}
                          onClick={() => time.value = 30}>30
                </g-btn-bs>
                <g-btn-bs class="elevation-1" backgroundColor={time.value === 45 ? '#BBDEFB' : 'white'}
                          onClick={() => time.value = 45}>45
                </g-btn-bs>
                <g-btn-bs class="elevation-1" backgroundColor={time.value === 60 ? '#BBDEFB' : 'white'}
                          onClick={() => time.value = 60}>60
                </g-btn-bs>
              </div>
              <g-btn-bs disabled={disabledConfirm.value} block large background-color="#2979FF"
                        onClick={confirmOrder.value}>Confirm
                -
                {t('common.currency', locale)}{$filters.formatCurrency(paymentTotal)}
              </g-btn-bs>
            </g-card>
          </g-dialog>
      )
    }
    const renderChoiceDialog = () => {
      return (
          <g-dialog v-model={dialog.value.choice} eager width="500">
            <g-card class="dialog r">
              <g-icon class="dialog-icon--close" onClick={() => dialog.value.choice = false} size="20">icon-close</g-icon>
              <div class="dialog-title">Select options</div>
              {(selectedProduct.value && selectedProduct.value.choices) &&
              <div class="dialog-content" key={dialog.value.choice}>
                {selectedProduct.value.choices.map((choice, index) =>
                    <div class="dialog-content__choice" key={index}>
                      <div class="dialog-content__choice-name">
                        <span class="fw-700">{choice.name}</span>
                        <span class="text-red ml-1">{choice.mandatory ? '*' : ''}</span>
                      </div>
                      <div class="dialog-content__choice-option">
                        {(choice.select === 'one' && choice.mandatory) ?
                            <g-radio-group v-model={modifiers[index]}>
                              {choice.options.map(option =>
                                  <g-radio color="#536DFE" value={option} key={option._id}
                                           label={`${option.name} (${t('common.currency', locale)}${$filters.formatCurrency(option.price)} )`}/>)}
                            </g-radio-group>
                            : choice.options.map(option =>
                                <g-checkbox v-model={modifiers[index]}
                                            color="#536DFE"
                                            value={option}
                                            label={getCheckboxLabel(option)}
                                            key={option._id}
                                />
                            )}
                      </div>
                    </div>)}
              </div>}
              <div class="dialog-action">
                <div class="row-flex align-items-center" style="line-height: 2">
                  <g-icon onClick={withModifiers(() => changeQuantity(-1), ['stop'])} color="#424242"
                          size="28">remove_circle_outline
                  </g-icon>
                  <span style="margin-left: 4px; margin-right: 4px; min-width: 20px; text-align: center">{quantity}</span>
                  <g-icon onClick={withModifiers(() => changeQuantity(1), ['stop'])} color="#424242" size="28">add_circle</g-icon>
                </div>
                <g-spacer/>
                <g-btn-bs min-width="80" height="100%" text-color="#424242"
                          onClick={() => dialog.value.choice = false}>Cancel
                </g-btn-bs>
                <g-btn-bs width="80" height="100%" rounded text-color="#FFFFFF" background-color="#536DFE"
                          disabled={unavailableToAdd.value} onClick={addProduct}>OK
                </g-btn-bs>
              </div>
            </g-card>
          </g-dialog>
      )
    }

    return genScopeId(() => <div class="delivery">
      { customerUiRender() }
      { renderDeliveryOrder() }
      { renderDeliveryDetail() }
      { renderOrderDialog() }
      { renderChoiceDialog() }
      { renderDialogs() }
    </div>)
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

    .key-enter {
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
