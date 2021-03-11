module.exports = {
  onlyUpdateCollections: ['BuildForm', 'ComponentBuilder', 'ProcessData'],
  files: [
    {loader:{ type: 'route'}, filePath: 'components2/FirstTimeSetup/FirstTimeSetup.vue', name: 'setup', path: '/pos-setup' },
    {loader: {type: 'route'}, filePath: 'components2/PosCustomer/PosCustomer.vue', name: 'posCustomer', path: '/pos-customer' },
    {loader: {type: 'route'}, filePath: 'components2/Customer/CustomerOrder.vue', name: 'posCustomerOrder', path: '/pos-customer-order' },
    {loader: {type: 'route'}, filePath: 'components2/OrderHistory/OrderHistory.vue', name: 'OrderHistory', path: '/pos-order-history'},
    {loader: {type: 'route'}, filePath: 'components2/posPrinterSetting/posPrinterSettingView.vue', name: 'posPrinterSettingView', path: '/pos-printer-setting' },
    {loader: {type: 'route'}, filePath: 'components2/Settings/Settings.vue', name: 'Settings', path: '/pos-settings'},
    {loader: {type: 'route'}, filePath: 'components2/Settings/view/viewUser/viewUser.vue', name: 'UserSetting', path: '/pos-view-user'},
    {loader: {type: 'route'}, filePath: 'components2/Settings/view/viewTax/viewTax.vue', name: 'TaxSetting', path: '/pos-view-tax'},
    {loader: {type: 'route'}, filePath: 'components2/Settings/view/viewPayment/viewPayment.vue', name: 'PaymentSetting', path: '/pos-view-payment'},
    {loader: {type: 'route'}, filePath: 'components2/Settings/view/viewGeneral.vue', name: 'GeneralSetting', path: '/pos-view-general'},
    {loader: {type: 'route'}, filePath: 'components2/Settings/view/viewCompany.vue', name: 'Company', path: '/pos-view-company'},
    {loader: {type: 'route'}, filePath: 'components2/Modifiers/dialogEditPopupModifier/dialogEditPopupModifiers2.vue', name: 'Modifier', path: '/pos-modifier'},
    {loader: {type: 'route'}, filePath: 'components2/Modifiers/dialogChoosePopupModifier/dialogChoosePopupModifier.vue', name: 'ChooseModifier', path: '/pos-choose-modifier'},
    {loader: {type: 'route'}, filePath: 'components2/Payment/Payment2.vue', name: 'Payment2', path: '/pos-payment'},
    {loader: {type: 'route'}, filePath: 'components2/Login/Login.vue', name: 'Login', path: '/pos-login'},
    {loader: {type: 'route'}, filePath: 'components2/EditTablePlan/EditTablePlan.vue', name: 'EditTablePlan', path: '/pos-edit-table-plan'},
    {loader: {type: 'route'}, filePath: 'components2/EditMenuCard/EditMenuCard2.vue', name: 'EditMenuCard2', path: '/pos-edit-menu-card'},
    {loader: {type: 'route'}, filePath: 'components2/OrderView/Order2.vue', name: 'Order2', path: '/pos-order/:id?'},
    {loader: {type: 'route'}, filePath: 'components2/Dashboard/PosDashboard.vue', name: 'Dashboard', path: '/pos-dashboard'},
    {loader: {type: 'route'}, filePath: 'components2/OrderView/delivery/PosOrderDelivery.vue', name: 'posOrderDelivery', path: '/pos-order-delivery'},
    {loader: {type: 'route'}, filePath: 'components2/Inventory/Inventory.vue', name: 'Inventory', path: '/pos-inventory'},
    {loader: {type: 'route'}, filePath: 'components2/Inventory/InventoryReport.vue', name: 'InventoryReport', path: '/pos-inventory-report'},
    {loader: {type: 'route'}, filePath: 'components2/Inventory/InventoryStock.vue', name: 'InventoryStock', path: '/pos-inventory-stock'},
    {loader: {type: 'route'}, filePath: 'components2/OtherViews/OrderHistory.vue', name: 'OrderHistory', path: '/pos-order-history'},
    {loader: {type: 'route'}, filePath: 'components2/Retail/Order/PosOrderRetail.vue', name: 'Retail', path: '/retail--order' },
    {loader: {type: 'route'}, filePath: 'components2/Retail/Order/PosOrderRetail.vue', name: 'RetailRefund', path: '/retail--order-refund' },
    {loader: {type: 'route'}, filePath: 'components2/Retail/Article/PosArticle.vue', name: 'Article', path: '/retail--article' },
    {loader: {type: 'route'}, filePath: 'components2/EndOfDay/PosEndOfDayReport.vue', name: 'PosEndOfDayReport', path: '/pos-eod-report'},
    {loader: {type: 'route'}, filePath: 'components2/MonthReport/posMonthReportView.vue', name: 'posMonthReportView', path: '/pos-month-report'},
    {loader: {type: 'route'}, filePath: 'components2/ReportViews/StaffReportView.vue', name: 'StaffReport', path: '/pos-staff-report'},
    //
    {loader: {type: 'init '}, path: 'composition/plugin-init.js'},
    {loader: {type: 'vue-singleton'}, path: 'components/Store/Snackbar.vue',},
    {loader: {type: 'vue-singleton'}, path: 'components2/EmptyStore.vue',},
    {loader: {type: 'backend-api'}, path: 'backend/dayjs-utils.js', type: 'backend'},
    {loader: {type: 'backend-api'}, path: 'backend/modifier/index.js', type: 'backend'},
    // {loader: {type: 'backend-api'}, path: 'backend/customer/customerSchemaRegister.js', type: 'backend'},
    {loader: {type: 'backend-api'}, path: 'backend/rest-handler.js', type: 'backend'},
    {loader: {type: 'backend-api'}, path: 'backend/get-version/get-version.js', type: 'backend'},
    {loader: {type: 'backend-api'}, path: 'backend/print/print-report/report-index.js', type: 'backend'},
    {loader: {type: 'backend-api'}, path: 'backend/print/print-kitchen/kitchen-printer.js', type: 'backend'},
    {loader: {type: 'backend-api'}, path: 'backend/print/print-entire-receipt/entire-receipt-printer.js', type: 'backend'},
    {loader: {type: 'backend-api'}, path: 'backend/print/test-printer/test-printer.js', type: 'backend'},
    // {loader: {type: 'backend-api'}, path: 'backend/call-system-handler/localhost-handler.js', type: 'backend'},
    // {loader: {type: 'backend-api'}, path: 'backend/call-system-handler/socketio-handler.js', type: 'backend'},
    {loader: {type: 'backend-api'}, path: 'backend/call-system-handler/modem-device-java-handler.js', type: 'backend'},
    {loader: {type: 'backend-api'}, path: 'backend/print/print-utils/virtual-printer.js', type: 'backend'},
    {loader: {type: 'css-loader'}, path: 'style/pos.css'},
    {loader: {type: 'backend-api'}, path: 'backend/initDemoData/initDemoData.js'},
    {loader: {type: 'backend-api'}, path: 'backend/migrate-data/index.js'},
    {loader: {type: 'backend-api'}, path: 'backend/order/index.js'},
    {loader: {type: 'backend-api'}, path: 'backend/inventory/inventory.js'},
    {loader: {type: 'backend-api'}, path: 'backend/online-order/online-order.js'},
    {loader: {type: 'backend-api'}, path: 'backend/rn-bridge/app-rn-bridge.js'},
    {loader: {type: 'backend-api'}, path: 'backend/order-logic/report-init-cms.js'},
    {loader: {type: 'backend-api'}, path: 'backend/commit/index.js'},
    {loader: {type: 'backend-api'}, path: 'backend/customer-screen/customer-socket-handler.js'},
    // {
    //   loader: {
    //     type: 'backend-api'
    //   },
    //   path: 'backend/master-node/index.js'
    // },
    {loader: {type: 'backend-api'}, path: 'backend/demo-data/socket-handler.js'},
    // {
    //   loader: {
    //     type: 'backend-api'
    //   },
    //   path: 'backend/usb-printer/usb-printer.js'
    // },
    {loader: {type: 'i18n'}, path: 'i18n/de.js'},
    {loader: {type: 'i18n'}, path: 'i18n/en.js'},
    {loader: {type: 'i18n'}, path: 'i18n/de-DE.js'},
    {loader: {type: 'i18n'}, path: 'i18n/vn.js'}
  ]
};
