<script>
import { computed, onActivated, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { datetimeFormat, genScopeId } from '../utils';
import {
  dialog,
  getOrderHistory,
  getTotalOrders,
  initI18n,
  openDialog,
  orderTypes,
  selectingOrder,
  setDatetimeFilter,
  setForwardFilter,
  setPaymentFilter,
  setTableFilter,
  setTypeFilter,
  updateFilter,
  updateTableData
} from './order-history-logics';
import OrderHistoryTable from './OrderHistoryTable';
import OrderHistoryDetail from './OrderHistoryDetail';
import DialogDateTimePicker from './dialogDateTimePicker';
import { appHooks } from '../AppSharedStates';
import { listPayments } from '../Settings/PaymentSetting/view-payment-logics';
import { execGenScopeId } from '../utils';

export default {
  components: { DialogDateTimePicker, OrderHistoryDetail, OrderHistoryTable },
  setup() {
    const { t } = useI18n()
    const orderHistoryPagination = ref({ limit: 15, currentPage: 1 })
    //fixme: this is hot fix, need a better solution
    datetimeFormat.value
    initI18n()
    appHooks.emit('settingChange') // to update payment methods list

    onActivated(() => {
      getOrderHistory();
      getTotalOrders();
    })

    const paymentMethods = computed(() => {
      return listPayments.value.map(({ name }) => ({
        text: name.charAt(0).toUpperCase() + name.slice(1),
        value: name
      }))
    })
    watch(() => orderHistoryPagination.value.limit, (newV) => {
      localStorage.setItem('orderHistoryPageSize', newV)
    }, { deep: true })

    async function deleteOrder() {
      try {
        const Order = cms.getModel('Order');
        await Order.findOneAndUpdate({ '_id': selectingOrder.value._id }, { status: 'cancelled' });
        await updateTableData()
      } catch (e) {
        console.error(e)
      }
    }

    const router = useRouter()

    function back() {
      router.push('/pos-dashboard')
    }

    function printOrderReport() {
      //fixme: complete this logic
    }

    function print() {
      if (selectingOrder.value)
        printOrderReport(selectingOrder.value)
    }

    async function applyFilter(filter) {
      updateFilter(filter)
      await getOrderHistory()
      await getTotalOrders()
    }

    async function applyOrderFilter(val) {
      const filter = {
        title: t('orderHistory.orderNo'),
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


    const renderToolbar = () =>
        <g-toolbar height={'50px'} color="#eeeeee" elevation="0">
          {execGenScopeId(() => <>
            <g-btn-bs style="margin-left: 0" elevation="2" icon="icon-back" onClick={back}>
              {t('ui.back')}
            </g-btn-bs>
            <g-spacer/>
            <g-btn-bs style="margin-right: 0" elevation="2" icon="icon-remove-square" onClick={() => openDialog('confirm')}>
              {t('orderHistory.deleteOrder')}
            </g-btn-bs>
            <g-btn-bs style="margin-right: 0" elevation="2" background-color="blue-accent-3" icon="icon-print2" onClick={print}>
              {t('ui.print')}
            </g-btn-bs>
          </>)}
        </g-toolbar>

    const renderDialogs = () => <>
      <dialog-confirm-delete v-model={dialog.confirm} type="Order No." label={selectingOrder.value && selectingOrder.value.id} onSubmit={deleteOrder}/>

      <DialogDateTimePicker v-model={dialog.datetime} onSubmit={setDatetimeFilter}/>

      <dialog-number-filter v-model={dialog.number} label={t('orderHistory.orderNo')} onSubmit={applyOrderFilter}/>

      <dialog-number-filter v-model={dialog.barcode} label={t('orderHistory.barcode')} onSubmit={applyBarcodeFilter}/>

      {
        // todo: staff dialog should be dialog-selection
      }
      <dialog-text-filter v-model={dialog.staff} label={t('orderHistory.staff')} onSubmit={applyStaffFilter}/>
      <dialog-range-filter v-model={dialog.amount} max={1000} label={t('orderHistory.amount')} onSubmit={applyRangeFilter}/>
      <dialog-selection-filter v-model={dialog.type} label={t('orderHistory.type')} items={orderTypes.value} onSubmit={setTypeFilter}/>
      <dialog-selection-filter v-model={dialog.payment} label="Payment Method" items={paymentMethods.value} onSubmit={setPaymentFilter}/>
      <dialog-number-filter v-model={dialog.table} label={t('orderHistory.tableNo')} onSubmit={setTableFilter}/>
      <dialog-text-filter v-model={dialog.forward} label="Forward Store" onSubmit={setForwardFilter}/>

    </>
    return genScopeId(() => <>
      <div class="order-history">
        <div class="order-history__main">
          <OrderHistoryTable class="col-9"/>
          <OrderHistoryDetail class="col-3" order={selectingOrder.value}/>
        </div>
        {renderToolbar()}
        {renderDialogs()}
      </div>
    </>)
  }
}
</script>

<style scoped lang="scss">
.order-history {
  height: 100%;

  &__main {
    height: calc(100% - 50px);
    display: flex;
  }

  .g-btn-bs {
    font-size: 14px;
    background-color: white;
  }
}
</style>
