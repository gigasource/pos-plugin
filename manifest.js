module.exports = {
  onlyUpdateCollections: ['BuildForm', 'ComponentBuilder', 'ProcessData'],
  files: [
    { loader: { type: 'route' }, loadPath: './PosLogin.vue', filePath: 'components2/Login/PosLogin.vue', name: 'Login', path: '/pos-login2' },
    // { loader: { type: 'route' }, loadPath: './EditTablePlan2.vue', filePath: 'components2/View/EditTablePlan/EditTablePlan2.vue', name: 'Plan2', path: '/pos-edit-table-plan-2' },
    // { loader: { type: 'route' }, loadPath: './Room_new.vue', filePath: 'components2/TablePlan/Room_new.vue', name: 'TablePlan', path: '/room' },
    // { loader: { type: 'route' }, loadPath: './PosDashboard.vue', filePath: 'components/Dashboard/PosDashboard.vue', name: 'Dashboard', path: '/pos-dashboard' },
    { loader: { type: 'route' }, loadPath: './FirstTimeSetUp.vue', filePath: 'components/View/FirstTimeSetUp.vue', name: 'Setup', path: '/pos-setup' },
    { loader: { type: 'route' }, loadPath: './Login.vue', filePath: 'components/View/Login.vue', name: 'Login', path: '/pos-login' },
    { loader: { type: 'route' }, loadPath: './Dashboard.vue', filePath: 'components/View/Dashboard.vue', name: 'Dashboard', path: '/pos-dashboard' },
    { loader: { type: 'route' }, loadPath: './OrderHistory.vue', filePath: 'components/View/OrderHistory.vue', name: 'OrderHistory', path: '/pos-order-history' },
    { loader: { type: 'route' }, loadPath: './Order.vue', filePath: 'components/View/Order.vue', name: 'Order', path: '/pos-order/:id?' },
    { loader: { type: 'route' }, loadPath: './Order.vue', filePath: 'components/View/Order.vue', name: 'Order-Mobile', path: '/pos-order-mobile/:id?' },
    { loader: { type: 'route' }, loadPath: './Settings.vue', filePath: 'components/View/Settings.vue', name: 'Settings', path: '/pos-settings' },
    { loader: { type: 'route' }, loadPath: './EditMenuCard.vue', filePath: 'components/View/EditMenuCard.vue', name: 'EditMenuCard', path: '/pos-edit-menu-card' },
    { loader: { type: 'route' }, loadPath: './Online.vue', filePath: 'components/View/Online.vue', name: 'Online', path: '/pos-online' },
    { loader: { type: 'route' }, loadPath: './EditTablePlan.vue', filePath: 'components/View/EditTablePlan.vue', name: 'EditTablePlan', path: '/pos-edit-table-plan' },
    { loader: { type: 'route' }, loadPath: './Inventory.vue', filePath: 'components/Inventory/Inventory.vue', name: 'Inventory', path: '/pos-inventory' },
    { loader: { type: 'route' }, loadPath: './InventoryReport.vue', filePath: 'components/Inventory/InventoryReport.vue', name: 'InventoryReport', path: '/pos-inventory-report' },
    { loader: { type: 'route' }, loadPath: './InventoryStock.vue', filePath: 'components/Inventory/InventoryStock.vue', name: 'InventoryStock', path: '/pos-inventory-stock' },
    { loader: { type: 'route' }, loadPath: './posEndOfDayReport.vue', filePath: 'components/View/posEndOfDayReport.vue', name: 'posEndOfDayReport', path: '/pos-eod-report' },
    { loader: { type: 'route' }, loadPath: './Payment.vue', filePath: 'components/View/Payment.vue', name: 'Payment', path: '/pos-payment' },
    { loader: { type: 'route' }, loadPath: './posMonthReportView.vue', filePath: 'components/View/posMonthReportView.vue', name: 'posMonthReportView', path: '/pos-month-report' },
    { loader: { type: 'route' }, loadPath: './posPrinterSettingView.vue', filePath: 'components/View/posPrinterSettingView.vue', name: 'posPrinterSettingView', path: '/pos-printer-setting' },
    { loader: { type: 'route' }, loadPath: './PosOrderDelivery.vue', filePath: 'components/posOrder/PosOrderDelivery.vue', name: 'posOrderDelivery', path: '/pos-order-delivery' },
    { loader: { type: 'route' }, loadPath: './CustomerOrder.vue', filePath: 'components/CustomerScreen/CustomerOrder.vue', name: 'posCustomerOrder', path: '/pos-customer-order' },
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
      path: 'backend/print-report/index.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/print-kitchen/kitchen-printer.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/print-entire-receipt/entire-receipt-printer.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/test-printer/test-printer.js',
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
      path: 'backend/print-utils/virtual-printer.js',
      type: 'backend'
    },
    // {
    //   loader: {
    //     type: 'css-loader'
    //   },
    //   path: 'style/pos.css'
    // },
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
      path: 'backend/order/inventory.js'
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
    }
  ]
};
