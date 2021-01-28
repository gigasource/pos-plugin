<script>
import { onBeforeMount } from 'vue';
import orderUtil from '../../components/logic/orderUtil';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

export default {

  setup() {
    const { t } = useI18n()
    const orderHistoryOrders = ref([])
    const orderHistoryFilters = ref([])
    const orderHistoryCurrentOrder = ref(null)
    const totalOrders = ref(null)
    const orderHistoryPagination = ref({ limit: 15, currentPage: 1 })
    const dialog = ref({
      confirm: false,
      amount: false,
      barcode: false,
      datetime: false,
      staff: false,
      number: false,
    })
    const dateFormat = ref(null)
    const timeFormat = ref(null)
    //todo: fix this
    // async created() {
    //   await this.getOrderHistory();
    //   await this.getTotalOrders();
    //
    //   const cachedPageSize = localStorage.getItem('orderHistoryPageSize')
    //   if (cachedPageSize) this.orderHistoryPagination.limit = parseInt(cachedPageSize)
    // }
    // async activated() {
    //   await this.getOrderHistory();
    //   await this.getTotalOrders();
    // },

    watch(() => orderHistoryPagination.value.limit, (newV) => {
      localStorage.setItem('orderHistoryPageSize', newV)
    }, { deep: true })

    function updateOrderHistoryFilter(filter) {
      const index = orderHistoryFilters.value.findIndex(f => f.title === filter.title);
      if (index > -1) {
        orderHistoryFilters.value.splice(index, 1, filter);
      } else {
        orderHistoryFilters.value.unshift(filter);
      }
      orderHistoryPagination.value.currentPage = 1;
    }

    async function getOrderHistory() {
      const orderModel = cms.getModel('Order');
      const condition = orderHistoryFilters.value.reduce((acc, filter) => (
              { ...acc, ...filter['condition'] }),
          { $or: [{ status: 'paid' }, { status: 'completed' }] });
      const { limit, currentPage } = orderHistoryPagination.value;
      const orders = await orderModel.find(condition).sort({ date: -1 }).skip(limit * (currentPage - 1)).limit(limit);
      orderHistoryOrders.value = orders.map(order => ({
        ...order,
        info: order.note,
        tax: order.vTax ? order.vTax : orderUtil.calOrderTax(order.items),
        dateTime: dayjs(order.date).format(`${dateFormat} ${timeFormat}`),
        amount: order.vSum ? order.vSum : orderUtil.calOrderTotal(order.items),
        staff: order.user,
        barcode: '',
        promotions: [],
      }));
      orderHistoryCurrentOrder.value = orderHistoryOrders.value[0];
    }

    async function getTotalOrders() {
      const orderModel = cms.getModel('Order');
      const condition = orderHistoryFilters.value.reduce((acc, filter) => (
              { ...acc, ...filter['condition'] }),
          { $or: [{ status: 'paid' }, { status: 'completed' }] });
      totalOrders.value = await orderModel.count(condition);
    }

    async function deleteOrder() {
      try {
        const orderModel = cms.getModel('Order');
        await orderModel.findOneAndUpdate({ '_id': orderHistoryCurrentOrder.value._id }, { status: 'cancelled' });
        const index = orderHistoryOrders.value.findIndex(o => o._id === orderHistoryCurrentOrder.value._id);
        orderHistoryOrders.value.splice(index, 1);
        orderHistoryCurrentOrder.value = orderHistoryOrders.value[0];
      } catch (e) {
        console.error(e)
      }
    }

    const router = useRoute()

    function back() {
      router.push('/pos-dashboard')
    }

    function openDialog(name) {
      dialog.value[name] = true
    }

    function printOrderReport() {}

    function print() {
      if (orderHistoryCurrentOrder.value)
        printOrderReport(orderHistoryCurrentOrder.value)
    }

    async function applyFilter(filter) {
      updateOrderHistoryFilter(filter)
      await getOrderHistory()
      await getTotalOrders()
    }

    async function applyOrderFilter(val) {
      const filter = {
        title: t('orderHistrory.orderNo'),
        text: val,
        condition: { $where: '/.*' + val + '.*/.test(this.id)' }
      }
      await applyFilter(filter)
    }

    async function applyBarcodeFilter(val) {
      const filter = {
        title: t('orderHistory.barcode'),
        text: val,
        condition: { barcode: { '$regex': val } }
      }
      await applyFilter(filter)
    }

    async function applyStaffFilter(val) {
      const filter = {
        title: t('orderHistory.staff'),
        text: val,
        condition: { 'user.name': { '$regex': val, $options: 'i' } }
      }
      await applyFilter(filter)
    }

    async function applyRangeFilter(val) {
      const filter = {
        title: t('orderHistory.amount'),
        text: val[0] + ' - ' + val[1],
        condition: { vSum: { '$gte': val[0], '$lte': val[1] } }
      }
      await applyFilter(filter)
    }

    return () => <>
      <div class="order-history">
        <div class="order-history__main">
          <order-history-table class="col-9"
                               totalOrders={totalOrders.value}
                               orderHistoryOrders={orderHistoryOrders.value}
                               v-model:order-history-current-order={orderHistoryCurrentOrder.value}
                               v-model:order-history-filters={orderHistoryFilters.value}
                               v-model:order-history-pagination={orderHistoryPagination.value}
                               onGetorderhistory={getOrderHistory}
                               onGettotalorders={getTotalOrders}
                               onUpdateorderhistoryfilter={updateOrderHistoryFilter}
                               onOpendialogfilter={openDialog}>
          </order-history-table>
          <order-history-detail class="col-3" orderHistoryCurrentOrder={orderHistoryCurrentOrder.value}>
          </order-history-detail>
        </div>
        <g-toolbar color="#eeeeee" elevation="0">
          <g-btn-bs elevation="2" icon="icon-back" onClick={back}>
            {t('ui.back')} </g-btn-bs>
          <g-spacer>
          </g-spacer>
          <g-btn-bs elevation="2" icon="icon-remove-square" onClick={() => openDialog('confirm')}>
            {t('orderHistory.deleteOrder')} </g-btn-bs>
          <g-btn-bs elevation="2" background-color="blue-accent-3" icon="icon-print2" onClick={print}>
            {t('ui.print')} </g-btn-bs>
        </g-toolbar>

        <dialog-confirm-delete v-model={dialog.value.confirm}
                               type="Order No."
                               label={orderHistoryCurrentOrder.value && orderHistoryCurrentOrder.value.id}
                               onSubmit={deleteOrder}>
        </dialog-confirm-delete>

        <dialog-date-time-picker v-model={dialog.value.datetime}
                                 v-model:orderhistoryfilters={orderHistoryFilters.value}
                                 nGetorderhistory={getOrderHistory}
                                 onGettotalorders={getTotalOrders}
                                 onUpdateorderhistoryfilter={updateOrderHistoryFilter}>
        </dialog-date-time-picker>

        <dialog-number-filter v-model={dialog.value.number}
                              label={t('orderHistory.orderNo')}
                              onSubmit={applyOrderFilter}>
        </dialog-number-filter>

        <dialog-number-filter v-model={dialog.value.barcode}
                              label={t('orderHistory.barcode')}
                              nSubmit={applyBarcodeFilter}>
        </dialog-number-filter>
        <dialog-text-filter v-model={dialog.value.staff}
                            label={t('orderHistory.staff')}
                            onSubmit={applyStaffFilter}>
        </dialog-text-filter>
        <dialog-range-filter v-model={dialog.value.amount}
                             max={1000} label={t('orderHistory.amount')}
                             onSubmit={applyRangeFilter}>
        </dialog-range-filter>
      </div>
    </>
  }
}
</script>

<style scoped lang="scss">
.order-history {
  height: 100%;

  &__main {
    height: calc(100% - 64px);
    display: flex;
  }

  .g-btn-bs {
    font-size: 14px;
    background-color: white;
  }
}
</style>
