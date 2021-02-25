import {ref} from "vue";

export const deliveryOrderMode = ref('tablet');
export const showKeyboard = ref(false); // only show in mobile mode
export const favorites = ref([]);
export const selectedCustomer = ref({});
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

export const placeId = ref('');

export const dialogMode = ref('add')

export function openDialog(mode, _address, _zipcode, index) {
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
    selectedAddress.value = index
  }
  dialogMode.value = mode
  dialog.value.input = true
}

export const autocompleteAddresses = ref([]);
