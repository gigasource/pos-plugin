import { ref } from 'vue'

// OrderStore: selectedCustomer
// OnlineOrderMain.vue
// PosCustomer.vue
// OrderStore.vue
// PosOrderDelivery.vue
const selectedCustomer = ref(null)


const posSettingMock = {
  generalSetting: {
    keyboardDeliveryConfig: [], // can be empty // TODO: sample data
    deliveryOrderMode: 'tablet' // tablet || 'mobile'
  }
}


// TODO:
const mockProducts = [
  {
    _id: 1, type: 'delivery', id: 1, name: 'Lorem ispum 1', price: 1, note: '',
    option: { favorite: true },
    choices: [
      {
        name: 'choice 1', mandatory: true, options: [
          { name: 'choice 1 - opt 1', price: 1 },
          { name: 'choice 1 - opt 2', price: 1.5 }
        ]
      },
      {
        name: 'choice 2', mandatory: false, options: [
          { name: 'choice 2 - opt 1', price: 1 },
          { name: 'choice 2 - opt 2', price: 1.5 }
        ]
      },
    ]
  },
  {
    _id: 2, type: 'delivery', id: 2, name: 'Lorem ispum 2', price: 2, note: '',
    option: { favorite: true }
  },
  {
    _id: 3, type: 'pickup', id: 3, name: 'Lorem ispum 3', price: 5, note: '',
    option: { favorite: false },
    choices: [
      { name: 'choice 6', mandatory: false },
    ]
  }
]

// search place for cms socket emit mock
// const searchPlaceResultMock = [
//   { description: 'Lorem ispum 1', place_id: '1234561' }, // TODO: Real place id
//   { description: 'Lorem ispum 2', place_id: '1234562' },
//   { description: 'Lorem ispum 3', place_id: '1234563' },
// ]
//// cms.socket.emit('searchPlace', text, this.token, places => { ... })


// getPlaceDetail mock data
// const getPlaceDetailMock1 = null
// const getPlaceDetailMock2 = ''
// const getPlaceDetailMock2 = {}
// const getPlaceDetailMock3 = {
//   name: 'house -- street -- zipcode -- city',
//   address_components: [
//     { types: ['street_number'], long_name: 'house' },
//     { types: ['route'], long_name: 'street' },
//     { types: ['postal_code'], long_name: 'zipcode' },
//     { types: ['locality'], long_name: 'city' },
//   ]
// }
////  cms.socket.emit('getPlaceDetail', place_id, this.token, data => { ... })


// const getZipcode_addressMock = 'string address'
// const getZipcode_zipCodeMock = 'string zipcode'
//// cms.socket.emit('getZipcode', `${this.street} ${this.house} ${this.city}`, this.token, (address, zipcode) => {
