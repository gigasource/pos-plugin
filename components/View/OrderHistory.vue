<template>
  <div class="order-history">
    <div class="order-history__main">
      <order-history-table
          class="col-9"
          :total-orders="totalOrders"
          :order-history-orders="orderHistoryOrders"
          v-model:order-history-current-order="orderHistoryCurrentOrder"
          v-model:order-history-filters="orderHistoryFilters"
          v-model:order-history-pagination="orderHistoryPagination"
          @getOrderHistory="getOrderHistory"
          @getTotalOrders="getTotalOrders"
          @updateOrderHistoryFilter="updateOrderHistoryFilter"
          @openDialogFilter="openDialog"
      />
      <order-history-detail class="col-3" :order-history-current-order="orderHistoryCurrentOrder"/>
    </div>
    <g-toolbar color="#eeeeee" elevation="0">
      <g-btn-bs elevation="2" icon="icon-back" @click="back">{{$t('ui.back')}}</g-btn-bs>
      <g-spacer/>
      <g-btn-bs elevation="2" icon="icon-remove-square" @click="openDialog('confirm')">{{$t('orderHistory.deleteOrder')}}</g-btn-bs>
      <g-btn-bs elevation="2" background-color="blue-accent-3" icon="icon-print2" @click="print">{{$t('ui.print')}}</g-btn-bs>
    </g-toolbar>
    <dialog-confirm-delete v-model="dialog.confirm" type="Order No." :label="orderHistoryCurrentOrder && orderHistoryCurrentOrder.id" @submit="deleteOrder"/>
    <dialog-date-time-picker
        v-model="dialog.datetime"
        v-model:orderHistoryFilters="orderHistoryFilters"
        @getOrderHistory="getOrderHistory"
        @getTotalOrders="getTotalOrders"
        @updateOrderHistoryFilter="updateOrderHistoryFilter"
    />
    <dialog-number-filter v-model="dialog.number" :label="$t('orderHistory.orderNo')" @submit="applyOrderFilter"/>
    <dialog-number-filter v-model="dialog.barcode" :label="$t('orderHistory.barcode')" @submit="applyBarcodeFilter"/>
    <dialog-text-filter v-model="dialog.staff" :label="$t('orderHistory.staff')" @submit="applyStaffFilter"/>
    <dialog-range-filter v-model="dialog.amount" :max="1000" :label="$t('orderHistory.amount')" @submit="applyRangeFilter"/>
  </div>
</template>

<script>
  import OrderHistoryDetail from "../OrderHistory/OrderHistoryDetail";
  import OrderHistoryTable from "../OrderHistory/OrderHistoryTable";
  import DialogConfirmDelete from "../Settings/dialog/dialogConfirmDelete";
  import orderUtil from '../logic/orderUtil';
  import DialogDateTimePicker from "../OrderHistory/dialogDateTimePicker";
  import DialogNumberFilter from "../pos-shared-components/dialogFilter/dialogNumberFilter";
  import DialogTextFilter from "../pos-shared-components/dialogFilter/dialogTextFilter";
  import DialogRangeFilter from "../pos-shared-components/dialogFilter/dialogRangeFilter";

  export default {
    name: "OrderHistory",
    components: {
      DialogRangeFilter,
      DialogTextFilter,
      DialogNumberFilter,
      DialogDateTimePicker,
      DialogConfirmDelete,
      OrderHistoryTable,
      OrderHistoryDetail},
    props: {},
    injectService: ['OrderStore:printOrderReport', 'PosStore:(dateFormat, timeFormat)'],
    data() {
      return {
        orderHistoryOrders: [],
        orderHistoryFilters: [],
        orderHistoryCurrentOrder: null,
        totalOrders: null,
        orderHistoryPagination: { limit: 15, currentPage: 1 },
        dialog: {
          confirm: false,
          amount: false,
          barcode: false,
          datetime: false,
          staff: false,
          number: false,
        },
        dateFormat: null,
        timeFormat: null,
      }
    },
    async created() {
      await this.getOrderHistory();
      await this.getTotalOrders();

      const cachedPageSize = localStorage.getItem('orderHistoryPageSize')
      if (cachedPageSize) this.orderHistoryPagination.limit = parseInt(cachedPageSize)
    },
    async activated() {
      await this.getOrderHistory();
      await this.getTotalOrders();
    },
    computed: {},
    watch: {
      'orderHistoryPagination.limit'(newVal) {
        localStorage.setItem('orderHistoryPageSize', newVal)
      },
    },
    methods: {
      updateOrderHistoryFilter(filter) {
        const index = this.orderHistoryFilters.findIndex(f => f.title === filter.title);
        if (index > -1) {
          this.orderHistoryFilters.splice(index, 1, filter);
        } else {
          this.orderHistoryFilters.unshift(filter);
        }
        this.orderHistoryPagination.currentPage = 1;
      },
      async getOrderHistory() {
        const orderModel = cms.getModel('Order');
        const condition = this.orderHistoryFilters.reduce((acc, filter) => (
                { ...acc, ...filter['condition'] }),
            { $or: [{ status: 'paid' }, { status: 'completed' }] });
        const { limit, currentPage } = this.orderHistoryPagination;
        const orders = await orderModel.find(condition).sort({ date: -1 }).skip(limit * (currentPage - 1)).limit(limit);
        this.orderHistoryOrders = orders.map(order => ({
          ...order,
          info: order.note,
          tax: order.vTax ? order.vTax : orderUtil.calOrderTax(order.items),
          dateTime: dayjs(order.date).format(`${this.dateFormat} ${this.timeFormat}`),
          amount: order.vSum ? order.vSum : orderUtil.calOrderTotal(order.items),
          staff: order.user,
          barcode: '',
          promotions: [],
        }));
        this.orderHistoryCurrentOrder = this.orderHistoryOrders[0];
      },
      async getTotalOrders() {
        const orderModel = cms.getModel('Order');
        const condition = this.orderHistoryFilters.reduce((acc, filter) => (
                { ...acc, ...filter['condition'] }),
            { $or: [{ status: 'paid' }, { status: 'completed' }] });
        this.totalOrders = await orderModel.count(condition);
      },
      async deleteOrder() {
        try {
          const orderModel = cms.getModel('Order');
          await orderModel.findOneAndUpdate({ '_id': this.orderHistoryCurrentOrder._id }, { status: 'cancelled' });
          const index = this.orderHistoryOrders.findIndex(o => o._id === this.orderHistoryCurrentOrder._id);
          this.orderHistoryOrders.splice(index, 1);
          this.orderHistoryCurrentOrder = this.orderHistoryOrders[0];
        } catch (e) {
          console.error(e)
        }
      },
      back() {
        this.$router.push('/pos-dashboard')
      },
      openDialog(name) {
        this.dialog[name] = true
      },
      printOrderReport() {},
      print() {
        if(this.orderHistoryCurrentOrder)
          this.printOrderReport(this.orderHistoryCurrentOrder)
      },
      async applyFilter(filter) {
        this.updateOrderHistoryFilter(filter)
        await this.getOrderHistory()
        await this.getTotalOrders()
      },
      async applyOrderFilter(val) {
        const filter = {
          title: this.$t('orderHistrory.orderNo'),
          text: val,
          condition: {$where: '/.*'+val+'.*/.test(this.id)'}
        }
        await this.applyFilter(filter)
      },
      async applyBarcodeFilter(val) {
        const filter = {
          title: this.$t('orderHistory.barcode'),
          text: val,
          condition: {barcode: {"$regex": val}}
        }
        await this.applyFilter(filter)
      },
      async applyStaffFilter(val) {
        const filter = {
          title: this.$t('orderHistory.staff'),
          text: val,
          condition: {'user.name': { '$regex': val, $options: 'i'}}
        }
        await this.applyFilter(filter)
      },
      async applyRangeFilter(val) {
        const filter = {
          title: this.$t('orderHistory.amount'),
          text: val[0] + ' - ' + val[1],
          condition: {vSum: { '$gte': val[0], '$lte': val[1] }}
        }
        await this.applyFilter(filter)
      }
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
