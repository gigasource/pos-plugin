import { ref, watch } from "vue";

export const deliveryOrderMode = ref('mobile');
export const showKeyboard = ref(false); // only show in mobile mode
export const favorites = ref([]);
export const selectedCustomer = ref({
  name: '',
  phone: '',
  addresses: []
});
export const selectedAddress = ref(0);

export const customerName = ref('');
export const customerPhoneNr = ref('');
export const address = ref('');
export const zipcode = ref('');
export const street = ref('')
export const house = ref('')
export const city = ref('')
watch(() => selectedCustomer.value, () => {
  if (selectedCustomer.value) {
    customerName.value = selectedCustomer.value.name === 'New customer' ? '' : selectedCustomer.value.name
    customerPhoneNr.value = selectedCustomer.value.phone
  }
})

export const dialog = ref({
  input: false,
  order: false,
  choice: false,
  note: false,
});
export const selectedCall = ref({})

export const placeId = ref('');

export const dialogMode = ref('add')

export function openDialog(mode, _address, _zipcode, _placeId, index) {
  if (mode === 'add') {
    customerName.value = selectedCustomer.value.name || ''
    customerPhoneNr.value = selectedCustomer.value.phone || ''
    address.value = ''
    zipcode.value = ''
    house.value = ''
    street.value = ''
    city.value = ''
    placeId.value = ''
  } else if (mode === 'edit') {
    customerName.value = selectedCustomer.value.name || ''
    address.value = _address
    zipcode.value = _zipcode
    placeId.value = _placeId
    selectedAddress.value = index
  }
  dialogMode.value = mode
  dialog.value.input = true
}

export const autocompleteAddresses = ref([]);
export function clearCustomer() {
  selectedCustomer.value = {
    name: '',
    phone: '',
    addresses: []
  }
}

function resetOrderData() {
  //fixme: OrderStore:resetOrderData
  console.warn('PosOrderDelivery2:resetOrderData was not implemented')
}

export function clearDeliveryOrder() {
  resetOrderData()
  selectedCustomer.value = {}
  customerName.value = ''
  customerPhoneNr.value = ''
  address.value = ''
  house.value = ''
  street.value = ''
  city.value = ''
  placeId.value = ''
}
