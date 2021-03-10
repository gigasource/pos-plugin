import { ref, computed } from 'vue';
import { isIOS } from '../../AppSharedStates';
import { calls, missedCalls } from '../../Settings/CallSystem/call-system-calls'
import {
  deliveryOrderMode, favorites, openDialog, selectedCustomer, showKeyboard,
  name, phone, address, zipcode, street, house, city, selectedAddress, placeId, autocompleteAddresses,
  dialog, dialogMode, selectedCall
} from './delivery-shared';
import _ from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import cms from 'cms';
import { addProduct } from '../pos-logic-be';
import { execGenScopeId } from '../../utils';
import { useI18n } from 'vue-i18n';

// TODO: split customerUiRender function into ->
//  1. render selected customer
//  2. render new for mobile
//  3. render new customer for table

let t

export function init() {
  ({ t } = useI18n())
}

export function deliveryCustomerUiFactory() {

  function getRandomColor(i) {
    const colors = ['#FBE4EC', '#84FFFF', '#80D8FF', '#FFF59D', '#B2FF59', '#E1BEE7', '#FFAB91', '#B39DDB', '#BCAAA4', '#1DE9B6']
    return 'background-color: ' + colors[i]
  }

  function selectFavoriteProduct(product) {
    addProduct({
      ...product,
      modifiers: [],
      quantity: 1,
    })
  }

  const isNewCustomer = computed(() => {
    return !(selectedCustomer.value && selectedCustomer.value.name)
  })

  function removeAddress(index) {
    selectedCustomer.value.addresses.splice(index, 1) // remove customer address

    if (selectedCustomer.value.addresses.length === 0) { // if no address then set new customer flag
      selectedAddress.value = -1
    } else if (selectedAddress.value >= index) { // otherwise, correct selected address index
      selectedAddress.value -= 1

      // in case the 1st address has been removed, then move to new first address line
      if (selectedAddress.value < 0)
        selectedAddress.value = 0
    }
  }

  let debounceSearchAddress = _.debounce(searchAddress, 300);
  //fixme: autocomplete use in both PosOrderDelivery & this file
  const autocomplete = ref();
  const token = ref('')

  async function searchAddress(text) {
    if (!text || text.length < 4) return
    token.value = uuidv4()
    cms.socket.emit('searchPlace', text, token.value, places => {
      autocompleteAddresses.value = places.map(p => ({
        text: p.description,
        value: p.place_id,
      }))
    })
  }

  const orderType = ref();

  function deleteCall(index) {
    //index => missed call || first call
    if (index) {
      missedCalls.value.splice(index, 1)
    } else {
      calls.value.splice(0, 1)
    }
  }

  function chooseCustomer(type) {
    orderType.value = type
    selectedCustomer.value = calls.value[0].customer
    name.value = selectedCustomer.value.name === 'New customer' ? '' : selectedCustomer.value.name
    phone.value = selectedCustomer.value.phone
  }

  function chooseMissedCustomer(index, type) {
    orderType.value = type
    const call = {
      ...missedCalls.value[index],
      type: 'missed'
    }
    calls.value.unshift(call)
    missedCalls.value.splice(index, 1)
    selectedCustomer.value = call.customer
    name.value = selectedCustomer.value.name === 'New customer' ? '' : selectedCustomer.value.name
    phone.value = selectedCustomer.value.phone
  }

  async function selectAutocompleteAddress(place_id) {
    placeId.value = place_id
    if (autocompleteAddresses.value.find(item => item.value === place_id)) {
      cms.socket.emit('getPlaceDetail', place_id, token.value, data => {
        if (!_.isEmpty(data)) {
          for (const component of data.address_components) {
            if (component.types.includes('street_number')) {
              house.value = component.long_name
            }
            if (component.types.includes('route')) {
              street.value = component.long_name
            }
            if (component.types.includes('postal_code')) {
              zipcode.value = component.long_name
            }
            if (component.types.includes('locality') || component.types.includes('administrative_area_level_1')) {
              city.value = component.long_name
            }
          }
          address.value = data.name
        }
      })
    }
  }

  function addNewCustomer() {
    if (dialogMode.value === 'add') {
      Object.assign(selectedCustomer.value, {
        name: name.value,
        phone: phone.value,
        addresses: [
          ...!!selectedCustomer.value.addresses ? _.cloneDeep(selectedCustomer.value.addresses) : [],
          {
            address: address.value,
            zipcode: zipcode.value,
            house: house.value,
            street: street.value,
            city: city.value,
            placeId: placeId.value
          }
        ]
      })
      selectedAddress.value = selectedCustomer.value.addresses.length - 1
    }
    if (dialogMode.value === 'edit') {
      selectedCustomer.value['name'] = name.value
      selectedCustomer.value.addresses.splice(selectedAddress.value, 1, {
        address: address.value,
        zipcode: zipcode.value,
        house: house.value,
        street: street.value,
        city: city.value,
        placeId: placeId.value
      })
    }
    dialog.value.input = false
  }

  function hideKeyboard() {
    showKeyboard.value = false
    const _autocomplete = autocomplete.value
    if (_autocomplete) {
      const menu = _autocomplete.$refs && _autocomplete.$refs.menu
      if (menu) {
        menu.isActive = false
      }
    }
  }

  // this only used when add new customer
  function submitCustomer() {
    //todo: fix this function logic
    if (name.value && phone.value) {
      let customer = {}
      customer.name = name.value
      customer.phone = phone.value
      if (selectedCustomer.value.addresses) {
        customer.addresses = [
          ...selectedCustomer.value.addresses,
          {
            address: address.value,
            zipcode: zipcode.value,
            house: house.value,
            street: street.value,
            city: city.value,
            placeId: placeId.value
          }
        ]
      } else if (address.value) {
        customer.addresses = [{
          address: address.value,
          zipcode: zipcode.value,
          house: house.value,
          street: street.value,
          city: city.value,
          placeId: placeId.value
        }]
      }
      selectedCustomer.value = customer
      selectedAddress.value = customer.addresses.length - 1
    }
    hideKeyboard()
  }

  // renders functions
  const renderFavorites = () => {
    if (deliveryOrderMode.value === 'tablet' || !showKeyboard.value)
      return (
        <div class="delivery-info__favorite">
          {favorites.value.map((f, i) =>
            <div style={getRandomColor(i)} class="delivery-info__favorite-item"
                 onClick={() => selectFavoriteProduct(f)}
                 key={`favorite_${i}`}>
              {f.name}
            </div>)}
        </div>
      )
  }
  const renderSelectedCustomer = () => {
    return <>
      {
        selectedCustomer.value.addresses.map((item, i) =>
          <div
            class={['delivery-info__customer-address', selectedAddress.value === i && 'delivery-info__customer-address--selected']}
            onClick={() => selectedAddress.value = i}>
            <div class="row-flex align-items-center">
              <g-radio small v-model={selectedAddress.value} value={i} label={`Address ${i + 1}`}
                       color="#536DFE"/>
              <g-spacer/>
              <g-btn-bs small style="margin: 0 2px; padding: 4px;" background-color="#F9A825"
                        onClick={() => openDialog('edit', item.address, item.zipcode, item.placeId, i)}>
                <g-icon size="15">icon-reservation_modify</g-icon>
              </g-btn-bs>
              <g-btn-bs small style="margin: 0 2px; padding: 4px;" background-color="#FF4452"
                        onClick={() => removeAddress(i)}>
                <g-icon size="15">icon-delete</g-icon>
              </g-btn-bs>
            </div>
            <p>{item.address}</p>
            <p class="text-grey fs-small">{item.zipcode}</p>
            <p class="text-grey fs-small">{item.city}</p>
          </div>)
      }
      <g-icon size="40" color="#1271FF" onClick={() => openDialog('add')}>add_circle</g-icon>
    </>
  }
  const renderNewCustomerForMobile = () => {
    return <>
      <div class="row-flex mt-3 w-100">
        <div style="flex: 1; margin-right: 2px">
          <g-text-field outlined dense v-model={phone.value} label={t('customer.phone')}
                        onClick={() => showKeyboard.value = true}
                        virtualEvent={isIOS.value}/>
        </div>
        <div style="flex: 1; margin-left: 2px">
          <g-text-field outlined dense v-model={name.value} label={t('customer.name')}
                        onClick={() => showKeyboard.value = true}
                        virtualEvent={isIOS.value}/>
        </div>
      </div>
      {
        orderType.value === 'delivery' &&
        <div className="row-flex" style="width: 100%">
          <div className="col-9">
            <g-combobox style="width: 100%" label="Address" v-model={placeId.value} outlined dense
                        clearable
                        virtualEvent={isIOS.value} skip-search
                        items={autocompleteAddresses.value} onUpdate:searchText={debounceSearchAddress}
                        ref="autocomplete"
                        onInputClick={() => showKeyboard.value = true} keep-menu-on-blur
                        menu-class="menu-autocomplete-address"
                        onUpdate:modelValue={selectAutocompleteAddress}/>
          </div>
          <div className="flex-grow-1 ml-1">
            <g-text-field disabled outlined dense v-model={house.value} label="Nr"
                          onClick={() => showKeyboard.value = true}
                          virtualEvent={isIOS.value}/>
          </div>
        </div>
      }
    </>
  }
  const renderNewCustomerForNonMobile = () => {
    return <>
      <g-text-field-bs class="bs-tf__pos" label="Name" v-model={name.value}
                       onClick={() => openDialog('add')} v-slots={{
        'append-inner': () => <g-icon onClick={() => openDialog('add')}>icon-keyboard</g-icon>
      }}>
      </g-text-field-bs>
      <g-text-field-bs class="bs-tf__pos" label="Address" v-model={address.value}
                       onClick={() => openDialog('add')} v-slots={{
        'append-inner': () => <g-icon onClick={() => openDialog('add')}>icon-keyboard</g-icon>
      }}>
      </g-text-field-bs>
    </>
  }
  const renderCustomerDeliveryInfo = () => {
    return (
      <div class="delivery-info__customer">
        {
          !isNewCustomer.value
            ? renderSelectedCustomer()
            : (deliveryOrderMode.value === 'mobile'
            ? renderNewCustomerForMobile()
            : renderNewCustomerForNonMobile())
        }
      </div>
    )
  }
  const renderPendingCalls = () => {
    return (
      <div class={['delivery-info__call', selectedCall.value && selectedCall.value.type === 'missed' ? 'b-red' : 'b-grey']}>
        <div class="delivery-info__call--info">
          <p class="fw-700 fs-small">
            <g-icon size="16" class="mr-1">icon-call</g-icon>
            {selectedCall.value.customer.phone}
          </p>
          <p class="fs-small text-grey-darken-1">{selectedCall.value.customer.name}</p>
        </div>
        <div class={['delivery-info__call-btn', orderType.value === 'pickup' && 'delivery-info__call-btn--selected']}
             onClick={() => chooseCustomer('pickup')}>
          <g-icon size="20">icon-take-away</g-icon>
        </div>
        <div class={['delivery-info__call-btn', orderType.value === 'delivery' && 'delivery-info__call-btn--selected']}
             onClick={() => chooseCustomer('delivery')}>
          <g-icon size="20">icon-delivery-scooter</g-icon>
        </div>
        <div class="delivery-info__call-btn--cancel" onClick={() => deleteCall()}>
          <g-icon color="white">clear</g-icon>
        </div>
      </div>
    )
  }
  const renderNoPendingCalls = () => {
    return (
      <div class="delivery-info__call--empty">
        <p class="fw-700">{t('common.empty')}</p>
        <p class="text-grey-darken-1">{t('onlineOrder.callSystem.noPendingCall')}</p>
      </div>
    )
  }
  const menuMissed = ref(false)
  const renderMissedCalls = () => {
    if (!missedCalls.value || missedCalls.value.length < 1)
      return

    return (
      <g-menu v-model={menuMissed.value} top left nudge-top="5"
              v-slots={{
                default: () => execGenScopeId(() =>
                  <div class="menu-missed">
                    {missedCalls.value.map((call, i) => (
                      <div class="menu-missed__call" key={`missed_${i}`}>
                        <div class="menu-missed__call--info">
                          <p class="fw-700 fs-small">
                            <g-icon size="16" class="mr-1">icon-call</g-icon>
                            {call.customer.phone}
                          </p>
                          <p class="fs-small text-grey-darken-1">{call.customer.name}</p>
                        </div>
                        <div class={['delivery-info__call-btn']}
                             onClick={() => chooseMissedCustomer(i, 'pickup')}>
                          <g-icon size="20">icon-take-away</g-icon>
                        </div>
                        <div class={['delivery-info__call-btn']}
                             onClick={() => chooseMissedCustomer(i, 'delivery')}>
                          <g-icon size="20">icon-delivery-scooter</g-icon>
                        </div>
                        <div class="delivery-info__call-btn--cancel" onClick={() => deleteCall(i)}>
                          <g-icon color="white">clear</g-icon>
                        </div>
                      </div>
                    ))}
                  </div>
                ),
                activator: ({ on }) => execGenScopeId(() =>
                  <div onClick={on.click} class={['delivery-info__call--missed', menuMissed.value && 'delivery-info__call--missed--selected']}>
                    <b>{t('onlineOrder.callSystem.missed')}</b>
                    <div class="delivery-info__call--missed-num">
                      {missedCalls.value.length}
                    </div>
                  </div>
                )
              }}>
      </g-menu>
    )
  }

  //
  const customerUiRender = () => (
    <div class="delivery-info">
      <div class="delivery-info--upper">
        {renderFavorites()}
        {renderCustomerDeliveryInfo()}
      </div>

      <div class="delivery-info--lower">
        {
          (selectedCall.value && selectedCall.value.customer)
            ? renderPendingCalls()
            : [renderNoPendingCalls(), renderMissedCalls()]
        }
      </div>
    </div>
  )

  const renderDialogs = () => (<>
    <dialog-form-input v-model={dialog.value.input} onSubmit={addNewCustomer}
                       eager={false}
                       v-slots={{
                         input: () =>
                           <div class="row-flex flex-wrap justify-around">
                             <pos-textfield-new style="width: 48%" label={t('customer.name')}
                                                v-model={name.value}/>
                             <pos-textfield-new style="width: 48%" label={t('customer.phone')}
                                                v-model={phone.value}/>
                             <g-combobox style="width: 98%" label={t('customer.address')} v-model={placeId.value} dense
                                         text-field-component="PosTextfieldNew" clearable
                                         virtualEvent={isIOS.value} skip-search
                                         items={autocompleteAddresses.value} onUpdate:searchText={debounceSearchAddress}
                                         keep-menu-on-blur
                                         menu-class="menu-autocomplete-address"
                                         onUpdate:modelValue={selectAutocompleteAddress}/>
                             <pos-textfield-new style="width: 23%" label="Street"
                                                placeholder="Street name (Autofill)"
                                                v-model={street.value}/>
                             <pos-textfield-new style="width: 23%" label="House no."
                                                placeholder="House number (Autofill)"
                                                v-model={house.value}/>
                             <pos-textfield-new style="width: 23%" label="Zipcode"
                                                placeholder="Zipcode (Autofill)"
                                                v-model={zipcode.value}/>
                             <pos-textfield-new style="width: 23%" label="City"
                                                placeholder="City (Autofill)"
                                                v-model={city.value}/>
                           </div>
                       }}
    />

    <dialog-text-filter v-model={dialog.value.note}
                        label="Delivery note"
                        onSubmit={e => note.value = e}/>

    {showKeyboard.value && <div class="keyboard">
      <div class="keyboard-overlay" onClick={hideKeyboard}></div>
      <div class="keyboard-wrapper">
        <pos-keyboard-full type="alpha-number" onEnterPressed={submitCustomer}/>
      </div>
    </div>}
  </>);

  return {
    calls,
    missedCalls,
    orderType,

    // partial render
    renderFavorites,
    renderSelectedCustomer,
    renderNewCustomerForMobile,
    renderNewCustomerForNonMobile,
    renderCustomerDeliveryInfo,
    renderPendingCalls,
    renderNoPendingCalls,
    renderMissedCalls,
    renderDialogs,

    // entire render
    customerUiRender
  }
}

export const { customerUiRender: renderCustomerSection, renderDialogs: renderCustomerDialogs, orderType } = deliveryCustomerUiFactory()
