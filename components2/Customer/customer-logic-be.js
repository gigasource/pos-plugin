import { watch } from 'vue'
import cms from 'cms'
import {
  currentAppType
} from '../AppType'
import {
  customers
} from './customer-logic-ui'
import _ from 'lodash'
import { ObjectID } from 'bson'

watch(() => currentAppType.value, async () => {
  await loadCustomers()
})

const Customer = cms.getModel('Customer')

export async function loadCustomers() {
  customers.value = await Customer.find({ appType: currentAppType.value })
}

export async function deleteCustomer(customerId) {
  await Customer.remove({ _id: customerId })
  _.remove(customers.value, customer => customer._id.toString() === customerId.toString())
}

export async function updateCustomer(customer) {
  customer.appType = currentAppType.value
  if (!customer._id) {
    customer._id = new ObjectID()
    customers.value.push(customer)
  } else {
    const foundCustomer = customers.value.find(_customer => _customer._id.toString() === customer._id.toString())
    Object.assign(foundCustomer, customer)
  }
  await Customer.update({ _id: customer._id }, customer, { upsert: true })
}
