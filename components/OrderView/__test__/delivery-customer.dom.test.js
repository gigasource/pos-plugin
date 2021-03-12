import {makeWrapper, wrapper} from "../../test-utils";
import _ from 'lodash'
const delay = require("delay");
import {
  deliveryOrderMode, favorites, openDialog, selectedCustomer, showKeyboard,
  name, phone, address, zipcode, street, house, city, selectedAddress, placeId, autocompleteAddresses
} from "../delivery/delivery-shared";
import { deliveryCustomerUiFactory } from '../delivery/delivery-customer-ui'
import { dialogMode } from '../delivery/delivery-shared';

import defaultMdc, { mockMissedCalls, mockFavorites, selectedCustomerMock } from './mock_delivery_data';
import { nextTick } from 'vue';
const runTestWithConfig = (mdc) => {
  mdc = _.merge(defaultMdc, mdc)
  deliveryOrderMode.value = mdc.deliveryOrderMode
  showKeyboard.value = mdc.showKeyboard
  favorites.value = mdc.favorites
  selectedCustomer.value = mdc.selectedCustomer
  selectedAddress.value = mdc.selectedAddress
  name.value = mdc.name
  phone.value = mdc.phone
  address.value = mdc.address
  zipcode.value = mdc.zipcode
  street.value = mdc.street
  house.value = mdc.house
  city.value = mdc.city
  placeId.value = mdc.placeId
  dialogMode.value = mdc.dialogMode
  autocompleteAddresses.value = mdc.autocompleteAddresses

  const Root = {
    name: 'CustomerUIRender',
    setup() {
      const { customerUiRender, calls, missedCalls, orderType } =  deliveryCustomerUiFactory()
      calls.value = mdc.calls || [] // default value
      missedCalls.value = mdc.missedCalls || [] // default value
      orderType.value = mdc.orderType // null || pickup || delivery
      return customerUiRender
    }
  }

  makeWrapper(Root)

  expect(wrapper.html()).toMatchSnapshot()
}

describe('order-delivery', () => {
  describe('favorites', () => {
    async function runRenderFavoriteTest() {
      favorites.value = mockFavorites
      makeWrapper({
        name: 'CustomerUIRender',
        setup() {
          const { renderFavorites } =  deliveryCustomerUiFactory()
          return renderFavorites
        }
      })
      await nextTick()
      await delay(50)
      expect(wrapper.html()).toMatchSnapshot()
    }
    it('should not render favorites in mobile mode when keyboard show', async () => {
      deliveryOrderMode.value = 'mobile'
      showKeyboard.value = true
      await runRenderFavoriteTest()
    })
    it("should render favorites in mobile mode when keyboard hide", async () => {

      deliveryOrderMode.value = 'mobile'
      showKeyboard.value = false
      await runRenderFavoriteTest()
    })
    it('should render favorites in tablet mode', async () => {
      deliveryOrderMode.value = 'tablet'
      showKeyboard.value = true
      await runRenderFavoriteTest()
    })
  })

  describe('selected customer', () => {
    async function runTest() {
      makeWrapper({
        name: 'CustomerUIRender',
        setup() {
          const { renderSelectedCustomer } =  deliveryCustomerUiFactory()
          return renderSelectedCustomer
        }
      })
      await nextTick()
      await delay(50)
      expect(wrapper.html()).toMatchSnapshot()
    }

    it('should render selected customer with selected address is the 2nd address', async () => {
      selectedCustomer.value = selectedCustomerMock
      selectedAddress.value = 1
      await runTest()
    })
  })

  describe('in mobile', function () {
    it('should render correct for new customer', () => {
      runTestWithConfig({
        deliveryOrderMode: 'mobile',
        selectedCustomer: null
      })
    })
    it('should render correct for selected customer', () => {
      // see selected customer in mock data
      runTestWithConfig({
        deliveryOrderMode: 'mobile'
      })
    })
    it('should show keyboard', () => {
      runTestWithConfig({
        deliveryOrderMode: 'mobile',
        showKeyboard: true
      })
    })
  });

  describe('in tablet', () => {
    it('should render correct for new customer', () => {
      runTestWithConfig({
        deliveryOrderMode: 'tablet',
        selectedCustomer: null
      })
    })
    it('should render correct for selected customer', () => {
      runTestWithConfig({
        deliveryOrderMode: 'tablet'
      })
    })
  })

  describe('missed calls', () => {
    it('should render missed calls', () => {
      runTestWithConfig({
        missedCalls: mockMissedCalls
      })
    })
  })
})
