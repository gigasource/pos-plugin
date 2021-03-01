import { ref, watch } from 'vue';
export const CUSTOMER_COLLECTION_NAME = 'Customer'
import { CRUdDbFactory } from '../../utils/CRUD/crud-db';
import { currentAppType } from '../AppType';
import cms from 'cms';

export const customers = ref([])

const Customer = cms.getModel(CUSTOMER_COLLECTION_NAME)

export async function loadCustomers() {
  customers.value = await Customer.find({ appType: currentAppType.value })
}

watch(() => currentAppType.value, async () => {
  await loadCustomers()
})

export async function createCustomer(customer) {
  customer.appType = currentAppType.value
  const { create } = CRUdDbFactory(customers.value, '', CUSTOMER_COLLECTION_NAME)
  return create(customer)
}

export async function removeCustomer(customer) {
  const { remove } = CRUdDbFactory(customers.value, '', CUSTOMER_COLLECTION_NAME)
  return remove(customer)
}

export async function updateCustomer(oldCustomer, newCustomer) {
  newCustomer.appType = currentAppType.value
  const { update } = CRUdDbFactory(customers.value, '', CUSTOMER_COLLECTION_NAME)
  return update(oldCustomer, newCustomer)
}

export async function advanceUpdateCustomer(customer) {
  customer.appType = currentAppType.value
  if (!customer._id) {
    return createCustomer(customer)
  } else {
    return updateCustomer({ _id: customer._id}, customer)
  }
}
