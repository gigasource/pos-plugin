import { ref } from 'vue'

export const selectedCustomer = ref({
  name: '',
  phone: '',
  addresses: [{
    address: '',
    house: '',
    zipcode: '',
    street: '',
    city: '',
  }]
})

export const dialog = ref({
  add: false,
  edit: false,
  delete: false
})
