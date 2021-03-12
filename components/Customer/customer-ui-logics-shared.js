import { ref, watch, reactive, toRaw } from 'vue'
import { CRUdFactory } from '../../utils/CRUD/crud';
import { ObjectID } from 'bson';
import { loadCustomers, createCustomer, removeCustomer, updateCustomer} from './customer-be-logics';

export const selectingCustomer = ref(null)
import Hooks from 'schemahandler/hooks/hooks'
import { isSameId } from '../utils';
import {getCustomerOrder, getCurrentOrder} from "../OrderView/pos-logic-be";
import {customers} from "./customer-logic";
import { hooks as orderHook } from "../OrderView/pos-logic";
import _ from 'lodash'
import {isIOS} from "../AppSharedStates";
import {v4 as uuidv4} from "uuid";

const token = uuidv4()

export const customerHooks = new Hooks()

//<editor-fold desc="Handle customer payment logic">
export const customerDialogData = reactive({
  name: '',
  phone: '',
  addresses: []
})

export async function calculateCustomerSpending(customer, order) {
  if (!customer) return
  if (!customer._id)
    customer = customers.value.find(_customer => _customer._id.toString() === customer.toString())
  if (!order) {
    customer.orders = await getCustomerOrder(customer._id)
    customer.spending = customer.orders.reduce((total, currentOrder) => {
      total += currentOrder.vSum
      return total
    }, 0)
  } else {
    customer.orders.push(order)
    customer.spending += order.vSum
  }
}

watch(() => customers.value, async () => {
  for (let customer of customers.value) {
    await calculateCustomerSpending(customer)
  }
})

// this must be received before pay is triggered so the layer is -1
orderHook.on('pay', -1, async () => {
  const currentOrder = _.clone(getCurrentOrder())
  await calculateCustomerSpending(currentOrder.customer, currentOrder)
})
//</editor-fold>

export const autocompleteAddresses = ref([])

async function searchAddress(text, index) {
  if (!text || text.length < 4) return
  cms.socket.emit('searchPlace', text, token, (places) => {
    autocompleteAddresses.value[index].places = places.map(place => ({
      text: place.description,
      value: place.place_id,
    }))
  })
}

export async function selectAutocompleteAddress(place_id, index) {
  if (autocompleteAddresses.value[index].places.find(item => item.value === place_id)) {
    cms.socket.emit('getPlaceDetail', place_id, token, data => {
      if (!_.isEmpty(data)) {
        for (const component of data.address_components) {
          if (component.types.includes('street_number')) customerDialogData.addresses[index].house = component.long_name
          if (component.types.includes('route')) customerDialogData.addresses[index].street =  component.long_name
          if (component.types.includes('postal_code')) customerDialogData.addresses[index].zipcode = component.long_name
          if (_.intersection(component.types, ['locality', 'administrative_area_level_1']).length) customerDialogData.addresses[index].city = component.long_name
        }
        customerDialogData.addresses[index].address = data.name
      }
    })
  }
}

export async function resetAddress(index) {
  customerDialogData.addresses[index].address = ''
  customerDialogData.addresses[index].house = ''
  customerDialogData.addresses[index].street = ''
  customerDialogData.addresses[index].zipcode = ''
  customerDialogData.addresses[index].city = ''
}

export const debounceSearchAddress = _.debounce(searchAddress, 300)

export function onSelectCustomer(customer) {
  selectingCustomer.value = customer
}

customerHooks.on('fetchCustomer', async () => {
  await loadCustomers()
})

export const showCustomerDialog = ref(false)

export const currentAction = ref('')

export async function onCreateCustomer(customer) {
  return await createCustomer(customer)
}

export async function onRemoveCustomer(customer) {
  await removeCustomer(customer)
  customerHooks.emit('fetchCustomer')
}

export async function onRemoveSelectingCustomer() {
  await onRemoveCustomer(selectingCustomer.value)
  selectingCustomer.value = null
}

export async function onUpdateCustomer(oldId, newInfo) {
  await updateCustomer({ _id: oldId }, newInfo)
}

export async function onUpdateSelectingCustomer(newInfo) {
  console.log(newInfo)
  await onUpdateCustomer(selectingCustomer.value._id, newInfo)
}

export function onOpenDialog(type) {
  currentAction.value = type
  if (type === 'add') {
    customerDialogData.name = ''
    customerDialogData.phone = ''
    customerDialogData.addresses = []
    autocompleteAddresses.value = []
  } else {
    customerDialogData.name = selectingCustomer.value.name
    customerDialogData.phone = selectingCustomer.value.phone
    customerDialogData.addresses = selectingCustomer.value.addresses
    autocompleteAddresses.value = _.range(selectingCustomer.value.addresses.length).map(() => ({
      places: [],
      model: ''
    }))
  }
  showCustomerDialog.value = true
}

export async function onDialogSubmit() {
  if (currentAction.value === 'add') {
    await onCreateCustomer(toRaw(customerDialogData))
  }
  if (currentAction.value === 'edit') {
    console.log('edit')
    await onUpdateSelectingCustomer(toRaw(customerDialogData))
  }
  customerHooks.emit('fetchCustomer')
  currentAction.value = ''
  showCustomerDialog.value = false
}

export function onAddAddress(_address) {
  const { create: createAddress } = CRUdFactory(customerDialogData, 'addresses')
  const newAddress = {
    _id: new ObjectID(),
    address: '',
    house: '',
    street: '',
    zipcode: '',
    city: ''
  }
  Object.assign(newAddress, _address)
  autocompleteAddresses.value.push({
    places: [],
    model: ''
  })
  return createAddress(newAddress)
}

export function onRemoveAddress(address) {
  const idx = _.findIndex(customerDialogData.addresses, (_address) => isSameId(_address, address))
  const { remove: removeAddress } = CRUdFactory(customerDialogData, 'addresses')
  removeAddress(address)
  if (idx !== -1) autocompleteAddresses.value.splice(idx, 1)
}

export function clearCustomerDialogData() {
  customerDialogData.name = ''
  customerDialogData.phone = ''
  customerDialogData.addresses = []
}

