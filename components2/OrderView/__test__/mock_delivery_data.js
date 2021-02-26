import { mockProducts } from './mock_products'
import _ from 'lodash'

export const mockFavorites = _.filter(mockProducts, p => p.option && p.option.favorite)
export const selectedCustomerMock = {
  'name': 'Tony',
  'phone': '0988.888.888',
  'addresses': [
    {
      address: 'address val 1',
      zipcode: 'zipcode val 1',
      house: 'hose val 1',
      street: 'street val 1',
      city: 'city val 1'
    },
    {
      address: 'address val 2',
      zipcode: 'zipcode val 2',
      house: 'hose val 2',
      street: 'street val 2',
      city: 'city val 2'
    }
  ],
}

export default {
  'favorites': mockFavorites, // favorite products
  //
  'selectedCustomer': selectedCustomerMock,

  // index of address will be used to ship product (in case the selected customer have more than 1 addrs)
  // TODO: [consider] rename to selectedAddressIndex
  'selectedAddress': 0,

  'address': '', // show in tablet mode for new customer
  'dialogMode': 'add', // edit
  'autocompleteAddresses': [], // only show in mobile mode (gather by query to cms backend)
  'placeId': '', // show in dialog input slot & deliveryOrderMode='mobile'
  'showKeyboard': false, // true
  'deliveryOrderMode': 'tablet', // mobile

  //
  'calls': [],
  'missedCalls': [],

  // doesn't show in snapshot (using in non-default slots)
  'name': 'Tommy',
  'phone': '084.999.8888',
  'zipcode': '',
  'city': '',
  'house': '',
  'street': '',
}
