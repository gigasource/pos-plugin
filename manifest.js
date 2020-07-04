module.exports = {
  onlyUpdateCollections: ['BuildForm', 'ComponentBuilder', 'ProcessData'],
  files: [
    // {
    //   loader: {
    //     type: 'vue-singleton'
    //   },
    //   path: 'components/Store/PermissionStore.vue',
    // },
    {
      loader: {
        type: 'vue-singleton'
      },
      path: 'components/Store/PosStore.vue',
    },
    // {
    //   loader: {
    //     type: 'vue-singleton'
    //   },
    //   path: 'components/Store/OrderStore.vue',
    // },
    // {
    //   loader: {
    //     type: 'vue-singleton'
    //   },
    //   path: 'components/Store/ReportsStore.vue',
    // },
    // {
    //   loader: {
    //     type: 'vue-singleton'
    //   },
    //   path: 'components/Store/SettingsStore.vue',
    // },
    // {
    //   loader: {
    //     type: 'vue-singleton'
    //   },
    //   path: 'components/Store/PosOnlineOrderStore.vue',
    // },
    // {
    //   loader: {
    //     type: 'vue-singleton'
    //   },
    //   path: 'components/Store/FileUploadStore.vue',
    // },
    // {
    //   loader: {
    //     type: 'vue-singleton'
    //   },
    //   path: 'components/Store/PosOnlineOrderManagementStore.vue',
    // },
    // {
    //   loader: {
    //     type: 'backend-api'
    //   },
    //   path: 'backend/print-report/report-printer.js',
    //   type: 'backend'
    // },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/rest-handle.js',
      type: 'backend'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/socket-io-server.js',
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
      path: 'backend/firebase-messaging/index.js'
    },
    {
      loader: {
        type: 'backend-api'
      },
      path: 'backend/daily-job/index.js'
    },
    // {
    //   loader: {
    //     type: 'ssr'
    //   },
    //   path: 'components/Report/MonthReport.vue'
    // },
    // {
    //   loader: {
    //     type: 'ssr'
    //   },
    //   path: 'components/Report/OrderReport.vue'
    // },
    // {
    //   loader: {
    //     type: 'ssr'
    //   },
    //   path: 'components/Report/StaffReport.vue'
    // },
    // {
    //   loader: {
    //     type: 'ssr'
    //   },
    //   path: 'components/Report/XReport.vue'
    // },
    // {
    //   loader: {
    //     type: 'ssr'
    //   },
    //   path: 'components/Report/ZReport.vue'
    // },
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
      path: 'i18n/en.js'
    },
    {
      loader: {
        type: 'i18n'
      },
      path: 'i18n/en-US.js'
    },
    {
      loader: {
        type: 'i18n'
      },
      path: 'i18n/en-GB.js'
    },
    {
      loader: {
        type: 'i18n'
      },
      path: 'i18n/fr-FR.js'
    }
  ]
};
