import { listPayments } from '../Settings/PaymentSetting/view-payment-logics';
import orderUtil from '../../components/logic/orderUtil';
import _ from 'lodash';
import { formatDatetime } from '../utils';
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n';
import { currentAppType } from '../AppType';

export const selectingOrder = ref({})

export function onSelectOrder(_order) {
  selectingOrder.value = _order
}

//i18n
let t

export function initI18n() {
  ({ t } = useI18n())
}

export const orders = ref([])

export const filters = ref([])

export const pagination = reactive({
  limit: 25,
  currentPage: 1
})

export const totalOrders = ref(0)

export const dialog = reactive({
  confirmDelete: false,
  amount: false,
  barcode: false,
  datetime: false,
  staff: false,
  number: false,
  type: false,
  table: false,
  payment: false,
  forward: false
})

export const orderTypes = ref([
  { text: 'Delivery', value: 'delivery' },
  { text: 'Pick-up', value: 'pickup' },
  { text: 'Dine-in', value: 'dinein' }
])

export function openDialog(_filter) {
  dialog[_filter] = true
}


//todo: watch filters, when filters change => call applyFilters
export const OrderHistoryDetailFactory = (props) => {
  const order = computed(() => props.order)
  const promotionTotal = computed(() => {
    return order.value && order.value.vDiscount;
  })
  const subTotal = computed(() => {
    return order.value && order.value.amount - order.value.tax;
  })
  const payment = computed(() =>
    (order.value && order.value.payment &&
      order.value.payment
      .filter(i => listPayments.value.some(m => m.name === i.type))
      .map(i => {
        const method = listPayments.value.find(m => m.name === i.type)
        return {
          ...method,
          ...i
        }
      })) || [])

  const tip = computed(() => order.value && order.value.tip)
  const items = computed(() => {
    return (order.value && order.value.items) ? order.value.items.filter(item => !!item.quantity) : []
  })

  const staffs = computed(() => {
    return (order.value && order.value.staff) || []
  })

  const createdUser = computed(() => {
    return (staffs.value && staffs.value.length && _.first(staffs.value).name) || ''
  })
  const cashierUser = computed(() => {
    return (staffs.value && staffs.value.length && _.last(staffs.value).name) || ''
  })


  //todo: reuse orderUtlis?
  function getItemPrice(item) {
    return orderUtil.getItemPrice(item)
  }

  function getExtraInfo(item) {
    return orderUtil.getExtraInfo(item)
  }

  function formatDate(val) {
    if (!val) return ''
    return dayjs(val).format('DD MMM YY, HH:mm')
  }

  return {
    order,
    promotionTotal,
    subTotal,
    payment,
    tip,
    items,
    staffs,
    createdUser,
    cashierUser,
    getItemPrice,
    getExtraInfo,
    formatDate
  }
}

export async function removeFilter(filter) {
  const _filters = _.cloneDeep(filters.value)
  const index = _filters.findIndex(f => f.title === filter.title);
  _filters.splice(index, 1);
  filters.value = _filters
  await applyFilter()
}

export async function clearFilters() {
  filters.value = []
  await applyFilter()
}

//todo: move to payment-logics ?
export function getOrderPayment({ payment }) {
  const payments = payment.filter(i => i.type === 'card' || i.type === 'cash')
  if (payments.length > 1) {
    return { icon: 'icon-multi_payment', multi: true }
  }
  //fixme: maybe there is some bug here
  const { value, type } = payment[0];
  let paymentMethod = listPayments.value.find(i => i.name === type)
  return Object.assign(paymentMethod || {}, { value, type })
}

export async function getOrderHistory() {
  const Order = cms.getModel('Order');
  const condition = filters.value.reduce((acc, filter) => ({ ...acc, ...filter['condition'] }),
    { $or: [{ status: 'paid' }, { status: 'completed' }, { status: 'cancelled' }], appType: currentAppType.value });
  const { limit, currentPage } = pagination
  const _orders = await Order.find(condition).sort({ date: -1 }).skip(limit * (currentPage - 1)).limit(limit);
  orders.value = _orders.map(order => ({
    ...order,
    info: order.note,
    tax: _.sumBy(_.values(order.vTaxSum), v => v.tax),
    dateTime: formatDatetime(order.date),
    amount: order.vSum,
    staff: order.user,
    barcode: order.bookingNumber,
    promotions: [],
  }));
  selectingOrder.value = orders.value[0];
}

export async function updateTableData() {
  await getOrderHistory()
  await getTotalOrders()
  if (orders.value.length > 0) selectingOrder.value = orders.value[0]
}

export async function updatePagination() {
  await updateTableData()
}

export async function updateCurrentPage(val) {
  if (val <= 0) return
  pagination.currentPage = val
  await updateTableData()
}

export async function updateLimit(val) {
  if (val <= 0) return
  pagination.limit = val
  await updateTableData()
}

export async function setPaymentFilter(payment) {
  if (!payment) return
  const filter = {
    title: 'Payment Method',
    text: payment,
    condition: { payment: { $elemMatch: { type: payment } } }
  }
  await applyFilter(filter)
}


export async function setTypeFilter(type) {
  if (!type) return
  const filter = {
    title: t('orderHistory.type'),
    text: orderTypes.value.find(item => item.value === type)['text'],
    condition: type === 'dinein' ? { type: null } : { type }
  }
  await applyFilter(filter)
}

export async function applyFilter(filter) {
  filter && updateFilter(filter)
  await updateTableData()
}

export async function setTableFilter(table) {
  const filter = {
    title: t('orderHistory.tableNo'),
    text: table,
    condition: { table }
  }
  await applyFilter(filter)
}

export async function setForwardFilter(value) {
  const filter = {
    title: 'Forward',
    text: value,
    condition: { 'forwardedStore': { '$regex': value, $options: 'i' } }
  }
  updateFilter(filter)
}

export async function setDatetimeFilter(datetimeRange) {
  if (!datetimeRange || datetimeRange.length < 2) return
  const filter = {
    title: 'Datetime',
    text: datetimeRange[0] + ' - ' + datetimeRange[1],
    condition: { date: { '$gte': new Date(datetimeRange[0] + ' 00:00:00'), '$lte': new Date(datetimeRange[1] + ' 23:59:59') } }
  };
  updateFilter(filter)
}

export function getStaffName(staffs) {
  // [NOTE] order.staff of an online order is object (not an array of object)
  // [Work-around]
  // TODO: unique the data format
  if (staffs) {
    if (Array.isArray(staffs)) {
      return staffs.map(s => s.name).join(', ')
    } else {
      return staffs.name
    }
  } else return ''
}

export async function getTotalOrders() {
  const orderModel = cms.getModel('Order');
  const condition = filters.value.reduce((acc, filter) => (
      { ...acc, ...filter['condition'] }),
    { $or: [{ status: 'paid' }, { status: 'completed' }] });
  totalOrders.value = await orderModel.count(condition);
}

export function updateFilter(filter) {
  const index = filters.value.findIndex(f => f.title === filter.title);
  if (index !== -1) {
    filters.value.splice(index, 1, filter);
  } else {
    filters.value.push(filter);
  }
  pagination.currentPage = 1;
}

