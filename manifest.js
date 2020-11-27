module.exports = {
  onlyUpdateCollections: ['BuildForm', 'ComponentBuilder', 'ProcessData'],
  files: [
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
      path: 'components/Store/VirtualPrinterStore.vue',
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
    // {
    //   loader: {
    //     type: 'backend-api'
    //   },
    //   path: 'backend/initDemoData/initDemoData.js'
    // },
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
    /*{
      loader: {
        type: 'backend-api'
      },
      path: 'backend/tse/tse.js'
    },*/
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
      path: 'backend/master-node/index.js'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/demo-data/socket-handler.js'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/usb-printer/usb-printer.js'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/handle-version/handle-version.js'
    },
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
