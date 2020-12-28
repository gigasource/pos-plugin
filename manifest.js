module.exports = {
  onlyUpdateCollections: ['BuildForm', 'ComponentBuilder', 'ProcessData'],
  files: [
    { loader: { type: 'route' }, filePath: 'components/View/FirstTimeSetUp.vue', name: 'Setup', path: '/pos-setup' },
    { loader: { type: 'route' }, filePath: 'components/View/Login.vue', name: 'Login', path: '/pos-login' },
    { loader: { type: 'route' }, filePath: 'components/View/Dashboard.vue', name: 'Dashboard', path: '/pos-dashboard' },
    { loader: { type: 'route' }, filePath: 'components/View/OrderHistory.vue', name: 'OrderHistory', path: '/pos-order-history' },
    { loader: { type: 'route' }, filePath: 'components/View/Order.vue', name: 'Order', path: '/pos-order/:id?' },
    { loader: { type: 'route' }, filePath: 'components/View/Order.vue', name: 'Order-Mobile', path: '/pos-order-mobile/:id?' },
    { loader: { type: 'route' }, filePath: 'components/View/Settings.vue', name: 'Settings', path: '/pos-settings' },
    { loader: { type: 'route' }, filePath: 'components/View/EditMenuCard.vue', name: 'EditMenuCard', path: '/pos-edit-menu-card' },
    { loader: { type: 'route' }, filePath: 'components/View/Online.vue', name: 'Online', path: '/pos-online' },
    { loader: { type: 'route' }, filePath: 'components/View/EditTablePlan.vue', name: 'EditTablePlan', path: '/pos-edit-table-plan' },
    { loader: { type: 'route' }, filePath: 'components/Tutorial/Tutorial.vue', name: 'Tutorial', path: '/pos-tutorial' },
    { loader: { type: 'route' }, filePath: 'components/Inventory/Inventory.vue', name: 'Inventory', path: '/pos-inventory' },
    { loader: { type: 'route' }, filePath: 'components/Inventory/InventoryReport.vue', name: 'InventoryReport', path: '/pos-inventory-report' },
    { loader: { type: 'route' }, filePath: 'components/Inventory/InventoryStock.vue', name: 'InventoryStock', path: '/pos-inventory-stock' },
    { loader: { type: 'route' }, filePath: 'components/View/posEndOfDayReport.vue', name: 'posEndOfDayReport', path: '/pos-eod-report' },
    { loader: { type: 'route' }, filePath: 'components/View/Payment.vue', name: 'Payment', path: '/pos-payment' },
    { loader: { type: 'route' }, filePath: 'components/View/posMonthReportView.vue', name: 'posMonthReportView', path: '/pos-month-report' },
    { loader: { type: 'route' }, filePath: 'components/View/posPrinterSettingView.vue', name: 'posPrinterSettingView', path: '/pos-printer-setting' },
    { loader: { type: 'route' }, filePath: 'components/Customer/PosCustomer.vue', name: 'posCustomer', path: '/pos-customer' },
    { loader: { type: 'route' }, filePath: 'components/posOrder/PosOrderDelivery.vue', name: 'posOrderDelivery', path: '/pos-order-delivery' },
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
