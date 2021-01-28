<template>
  <div class="dashboard">
    <pos-dashboard-sidebar
        v-model:view="view"
        :items="computedDashboardSidebar"
        :default-path="defaultSidebarPath"
        :after-mount-fn="afterMountFn"/>
    <content-render v-model:view="view">
      <template v-slot:ManualTable>
        <pos-order-manual-table :is-mobile="isMobile" :active-orders="activeOrders" @setInitOrderProps="setInitOrderProps"/>
      </template>
      <template v-slot:Functions>
        <pos-dashboard-function v-model:view="view" :enabledFeatures="enabledFeatures" :user="user"/>
      </template>
      <template v-slot:Restaurant="{ id }">
        <restaurant-room
            :id="id"
            :activeOrders="activeOrders"
            :user="user"
            @setInitOrderProps="setInitOrderProps"
            @changeTable="changeTable"
        />
      </template>
      <template v-slot:Dashboard>
        <OnlineOrderMain
            :pending-orders="pendingOrders"
            :kitchen-orders="kitchenOrders"
            :default-prepare-time="defaultPrepareTime"
            :online-order-sorting="onlineOrderSorting"
            @updateOnlineOrders="updateOnlineOrders"
            @acceptPendingOrder="acceptPendingOrder"
            @declineOrder="declineOrder"
            @completeOrder="completeOrder"
            @getPendingOnlineOrderCounter="getPendingOnlineOrderCounter"
          />
      </template>
      <template v-slot:Order="{ status }">
        <OnlineOrderList
            :status="status"
            :store-locale="storeLocale"
            :user="user"
            :online-orders="onlineOrders"
            :is-refund-failed="isRefundFailed"
            :is-refundable="isRefundable"
            :is-refunded="isRefunded"
            :get-online-orders-with-status="getOnlineOrdersWithStatus"
            @refundOrder="refundOrder"
        />
      </template>
      <template v-slot:Services>
        <OnlineOrderServices
            @getOnlineDeviceServices="getOnlineDeviceServices"
            @updateOnlineDeviceServices="updateOnlineDeviceServices"
            @showErrorSnackbar="showErrorSnackbar"
            @showInfoSnackbar="showInfoSnackbar"
        />
      </template>
      <template v-slot:Reservation>
        <ReservationsList
            :reservations="reservations"
            @getReservations="getReservations"
            @updateReservation="updateReservation"
            :reservationSetting="reservationSetting"
            @getReservationSetting="getReservationSetting"
            @removeReservation="removeReservation"
            @completeReservation="completeReservation"
            @getPendingReservationsLength="getPendingReservationsLength"
        />
      </template>
      <template v-slot:VirtualPrinter>
        <VirtualPrinterView/>
      </template>
    </content-render>
  </div>
</template>

<script>
  import _ from 'lodash'
  import PosDashboardSidebar from "../Dashboard/PosDashboardSidebar";
  import ContentRender from "../common/ContentRender";
  import PosOrderManualTable from "../Order/PosOrderManualTable";
  import PosDashboardFunction from "../Dashboard/PosDashboardFunction";
  import RestaurantRoom from "../Restaurant/RestaurantRoom";
  import OnlineOrderMain from "../OnlineOrder/OnlineOrderMain1";
  import OnlineOrderList from "../OnlineOrder/OnlineOrderList";
  import OnlineOrderServices from "../OnlineOrder/OnlineOrderServices";
  import ReservationsList from "../Reservation/ReservationsList";
  import VirtualPrinterView from "../VirtualPrinter/VirtualPrinterView";
  export default {
    name: "Dashboard",
    components: {
      VirtualPrinterView,
      ReservationsList,
      OnlineOrderServices,
      OnlineOrderList,
      OnlineOrderMain,
      RestaurantRoom, PosDashboardFunction, PosOrderManualTable, ContentRender, PosDashboardSidebar},
    injectService: [
        'PosStore:(computedDashboardSidebar, defaultSidebarPath, storeLocale, user, showErrorSnackbar, showInfoSnackbar, enabledFeatures, getPendingReservationsLength, getPendingOnlineOrderCounter, isMobile)',
        'OrderStore:(pendingOrders, kitchenOrders, updateOnlineOrders, declineOrder, acceptPendingOrder, completeOrder, activeOrders, setInitOrderProps, ' +
        '            getOnlineOrdersWithStatus, onlineOrders, isRefundable, isRefundFailed, refundOrder, isRefunded,' +
        '            reservations, getReservations, updateReservation, removeReservation, completeReservation,' +
        '            currentOrder, resetOrderData, changeTable)',
        'SettingsStore:(onlineOrderSorting, defaultPrepareTime, getOnlineDeviceServices, updateOnlineDeviceServices, reservationSetting, getReservationSetting)'
    ],
    data() {
      return {
        computedDashboardSidebar: null,
        defaultSidebarPath: null,
        view: null,
        afterMountFn: instance => {
          const pathArr = instance.defaultPath.split('.');
          pathArr.shift();
          const item = _.get(instance.items, pathArr.map(i => i === 'item' ? 'items' : i).join('.'))
          item.onClick.bind(instance)()
        },
        pendingOrders: [],
        kitchenOrders: [],
        defaultPrepareTime: null,
        onlineOrderSorting: null,
        storeLocale: null,
        user: null,
        onlineOrders: [],
        isRefundable: null,
        isRefundFailed: null,
        isRefunded: null,
        enabledFeatures: null,
        reservations: [],
        reservationSetting: null,
        isMobile: null,
        activeOrders: [],
        currentOrder: null
      }
    },
    methods: {
      updateOnlineOrders() {},
      declineOrder() {},
      acceptPendingOrder() {},
      completeOrder() {},
      getPendingOnlineOrderCounter() {},
      getOnlineOrdersWithStatus() {},
      refundOrder() {},
      getOnlineDeviceServices() {},
      updateOnlineDeviceServices() {},
      showErrorSnackbar() {},
      showInfoSnackbar() {},
      getReservations() {},
      updateReservation() {},
      getReservationSetting() {},
      removeReservation() {},
      completeReservation() {},
      getPendingReservationsLength() {},
      setInitOrderProps() {},
      resetOrderData() {},
      changeTable() {}
    }
  }
</script>

<style scoped lang="scss">
  .dashboard {
    display: flex;
    height: 100%;
  }
</style>
