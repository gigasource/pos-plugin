import { CRUdDbFactory } from '../../utils/CRUD/crud-db';
import { CUSTOMER_COLLECTION_NAME } from './customer-be-logics';
import { ref, computed, reactive, toRaw } from 'vue'
import { CRUdFactory } from '../../utils/CRUD/crud';
import { ObjectID } from 'bson';
import { loadCustomers, createCustomer, removeCustomer, updateCustomer} from './customer-be-logics';

export const selectingCustomer = ref(null)
import Hooks from 'schemahandler/hooks/hooks'
import { isSameId } from '../utils';

export const customerHooks = new Hooks()

export const customerDialogData = reactive({
  name: '',
  phone: '',
  addresses: []
})

export const autocompleteAddresses = ref([])

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
  const idx = _.findIndex(customerDialogData.addresses, isSameId(i, address))
  const { remove: removeAddress } = CRUdFactory(customerDialogData, 'addresses')
  removeAddress(address)
  if (idx !== -1) autocompleteAddresses.value.splice(idx, 1)
}
