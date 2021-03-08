import {ref} from "vue";

export const deliveryOrderMode = ref('mobile');
export const showKeyboard = ref(false); // only show in mobile mode
export const favorites = ref([]);
export const selectedCustomer = ref({
  name: '',
  phone: '',
  addresses: []
});
export const selectedAddress = ref(0);

export const name = ref('');
export const phone = ref('');
export const address = ref('');
export const zipcode = ref('');
export const street = ref('')
export const house = ref('')
export const city = ref('')
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
    name.value = selectedCustomer.value.name || ''
    phone.value = selectedCustomer.value.phone || ''
    address.value = ''
    zipcode.value = ''
    house.value = ''
    street.value = ''
    city.value = ''
    placeId.value = ''
  } else if (mode === 'edit') {
    name.value = selectedCustomer.value.name || ''
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
