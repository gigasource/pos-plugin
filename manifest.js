module.exports = {
  onlyUpdateCollections: ['BuildForm', 'ComponentBuilder', 'ProcessData'],
  files: [
    // components 2
    { loader: { type: 'route' }, filePath: 'components2/Modifiers/dialogEditPopupModifier/dialogEditPopupModifiers2.vue', name: 'Modifier', path: '/pos2-modifier' },
    { loader: { type: 'route' }, filePath: 'components2/Modifiers/dialogChoosePopupModifier/dialogChoosePopupModifier2.vue', name: 'ChooseModifier', path: '/pos2-choose-modifier' },
    { loader: { type: 'route' }, filePath: 'components2/Payment/Payment2.vue', name: 'Payment2', path: '/pos-payment' },
    { loader: { type: 'route' }, filePath: 'components2/Login/PosLogin.vue', name: 'Login', path: '/pos2-login' },
    { loader: { type: 'route' }, filePath: 'components2/EditTablePlan/EditTablePlan.vue', name: 'EditTablePlan', path: '/pos-edit-table-plan' },
    { loader: { type: 'route' }, filePath: 'components2/EditMenuCard/EditMenuCard2.vue', name: 'EditMenuCard2', path: '/pos2-edit-menu-card' },
    { loader: { type: 'route' }, filePath: 'components2/OrderView/Order2.vue', name: 'Order2', path: '/pos-order/:id?' },
    { loader: { type: 'route' }, filePath: 'components2/Dashboard/PosDashboard.vue', name: 'Dashboard', path: '/pos-dashboard' },
    { loader: { type: 'route' }, filePath: 'components2/OrderView/delivery/PosOrderDelivery2.vue', name: 'posOrderDelivery', path: '/pos-order-delivery' },
    { loader: { type: 'route' }, filePath: 'components2/Inventory/Inventory.vue', name: 'Inventory', path: '/pos-inventory' },
    { loader: { type: 'route' }, filePath: 'components2/Inventory/InventoryReport.vue', name: 'InventoryReport', path: '/pos-inventory-report' },
    { loader: { type: 'route' }, filePath: 'components2/Inventory/InventoryStock.vue', name: 'InventoryStock', path: '/pos-inventory-stock' },
    { loader: { type: 'route' }, filePath: 'components2/Reservation/ReservationsList2.vue', name: 'Reservation', path: '/pos-reservation' },
    { loader: { type: 'route' }, filePath: 'components2/Retail/Order/PosOrderRetail.vue', name: 'Retail', path: '/retail--order' },
    { loader: { type: 'route' }, filePath: 'components2/Retail/Order/Payment/PosRetailPayment.vue', name: 'RetailPayment', path: '/retail--order-payment' },
    { loader: { type: 'route' }, filePath: 'components2/Retail/Article/PosArticle.vue', name: 'Article', path: '/retail--article' },
    { loader: { type: 'route' }, filePath: 'components2/Customer/Customer.vue', name: 'Customer', path: '/pos-customer' },
    /// old components
    // { loader: { type: 'route' }, filePath: 'components2/Dashboard/DashboardSidebar/PosDashboardSidebar2.vue', name: 'Dashboard2', path: '/pos2-dashboard' },
    { loader: { type: 'route' }, filePath: 'components/View/FirstTimeSetUp.vue', name: 'Setup', path: '/pos-setup' },
    { loader: { type: 'route' }, filePath: 'components/View/Login.vue', name: 'Login', path: '/pos-login' },
    //{ loader: { type: 'route' }, filePath: 'components/View/Dashboard.vue', name: 'Dashboard', path: '/pos2-dashboard' },
    { loader: { type: 'route' }, filePath: 'components/View/OrderHistory.vue', name: 'OrderHistory', path: '/pos-order-history' },
    //{ loader: { type: 'route' }, filePath: 'components/View/Order.vue', name: 'Order', path: '/pos-order/:id?' },
    { loader: { type: 'route' }, filePath: 'components/View/Settings.vue', name: 'Settings', path: '/pos-settings' },
    { loader: { type: 'route' }, filePath: 'components/View/EditMenuCard.vue', name: 'EditMenuCard', path: '/pos-edit-menu-card' },
    { loader: { type: 'route' }, filePath: 'components/View/Online.vue', name: 'Online', path: '/pos-online' },
    { loader: { type: 'route' }, filePath: 'components/Inventory/Inventory1.vue', name: 'Inventory1', path: '/pos1-inventory' },
    { loader: { type: 'route' }, filePath: 'components/Inventory/InventoryReport1.vue', name: 'InventoryReport1', path: '/pos1-inventory-report' },
    { loader: { type: 'route' }, filePath: 'components/Inventory/InventoryStock1.vue', name: 'InventoryStock1', path: '/pos1-inventory-stock' },
    //{ loader: { type: 'route' }, filePath: 'components/View/posEndOfDayReport.vue', name: 'posEndOfDayReport', path: '/pos-eod-report' },
    { loader: { type: 'route' }, filePath: 'components2/EndOfDay/PosEndOfDayReport.vue', name: 'PosEndOfDayReport', path: '/pos-eod-report' },

    // { loader: { type: 'route' }, filePath: 'components/View/Payment.vue', name: 'Payment', path: '/pos-payment' },
    // { loader: { type: 'route' }, filePath: 'components/View/posMonthReportView.vue', name: 'posMonthReportView', path: '/pos-month-report' },
    { loader: { type: 'route' }, filePath: 'components2/MonthReport/posMonthReportView.vue', name: 'posMonthReportView', path: '/pos-month-report' },

    { loader: { type: 'route' }, filePath: 'components/View/posPrinterSettingView.vue', name: 'posPrinterSettingView', path: '/pos-printer-setting' },
    { loader: { type: 'route' }, filePath: 'components/posOrder/PosOrderDelivery.vue', name: 'posOrderDelivery1', path: '/pos1-order-delivery' },
    { loader: { type: 'route' }, filePath: 'components/CustomerScreen/CustomerOrder.vue', name: 'posCustomerOrder', path: '/pos-customer-order' },
    { loader: { type: 'route' }, filePath: 'components/View/PosCustomer.vue', name: 'posCustomer', path: '/pos-customer' },
    { loader: { type: 'route' }, filePath: 'components2/ReportViews/StaffReportView.vue', name: 'StaffReport', path: '/pos-staff-report' },
    {
      loader: { type: 'init '},
      path: 'composition/plugin-init.js'
    },
    {
      loader: {
        type: 'vue-singleton'
      },
      path: 'components/Store/Snackbar.vue',
    },
    {
      loader: {
        type: 'vue-singleton'
      },
      path: 'components/Store/PosStore.vue',
    },
    {
      loader: {
        type: 'vue-singleton'
      },
      path: 'components/Store/OrderStore.vue',
    },
    {
      loader: {
        type: 'vue-singleton'
      },
      path: 'components/Store/ReportsStore.vue',
    },
    {
      loader: {
        type: 'vue-singleton'
      },
      path: 'components/Store/SettingsStore.vue',
    },
    {
      loader: {
        type: 'vue-singleton'
      },
      path: 'components/Store/RoomStore.vue',
    },
    {
      loader: {
        type: 'vue-singleton'
      },
      path: 'components/Store/InventoryStore.vue',
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/dayjs-utils.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/modifier/index.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/rest-handler.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/get-version/get-version.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/print/print-report/report-index.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/print/print-kitchen/kitchen-printer.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/print/print-entire-receipt/entire-receipt-printer.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/print/test-printer/test-printer.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/call-system-handler/localhost-handler.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/call-system-handler/socketio-handler.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/call-system-handler/modem-device-java-handler.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/print/print-utils/virtual-printer.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'css-loader'
      },
      path: 'style/pos.css'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/initDemoData/initDemoData.js'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/migrate-data/index.js'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/order/index.js'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/inventory/inventory.js'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/online-order/online-order.js'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/rn-bridge/app-rn-bridge.js'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/order-logic/report-init-cms.js'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/commit/index.js'
    },
    // {
    //   loader: {
    //     type: 'backend-api'
    //   },
    //   path: 'backend/master-node/index.js'
    // },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/demo-data/socket-handler.js'
    },
    // {
    //   loader: {
    //     type: 'backend-api'
    //   },
    //   path: 'backend/usb-printer/usb-printer.js'
    // },
    {
      loader: {
        type: 'i18n'
      },
      path: 'i18n/de.js'
    },
    {
      loader: {
        type: 'i18n'
      },
      path: 'i18n/en.js'
    },
    {
      loader: {
        type: 'i18n'
      },
      path: 'i18n/de-DE.js'
    },
    {
      loader: {
        type: 'i18n'
      },
      path: 'i18n/vn.js'
    }
  ]
};
