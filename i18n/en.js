// default i18n
module.exports = {
  en: {
    //login
    login: {
      network: 'Network',
      support: 'Support',
      version: 'Version',
      internet: 'Internet',
      errorPasscode: 'Passcode is incorrect'
    },
    //dashboard
    dashboard: {
      dashboard: 'Dashboard',
      retail: 'Retail',
      welcome: 'Welcome!',
      logOut: 'Log Out',
      cashRegister: 'Cash Register',
      orderHistory: 'Order History',
      adminDashboard: 'Admin Dashboard',
      staffReport: 'Staff Report',
      endOfDay: 'End of Day',
      monthlyReport: 'Monthly Report'
    },

    //article view
    article: {
      changePrice: 'Change Price',
      note: 'Note',
      productLookup: 'Product Lookup',
      disabled: 'Disabled',
      plasticRefund: 'Plastic Refund',
      quickCash: 'Quick Cash',
      save: 'Save',
      pay: 'Pay',
      product: 'Product',
      category: 'Category',
      unit: 'Unit',
      price: 'Price',
      tax: 'Tax',
      barcode: 'Barcode',
      attributes: 'Attributes',
      attribute: 'Attribute',
      productId: 'Product ID',
      name: 'Name'
    },

    //UI
    ui: {
      back: 'Back',
      cancel: 'Cancel',
      print: 'Print',
      notification: 'Notification',
      ok: 'OK',
      confirmation: 'Confirmation',
      reprint: 'Reprint',
      more: 'More',
      save: 'Save',
      submit: 'Submit',
      edit: 'Edit',
      delete: 'Delete',
      change: 'Change',
      sort: 'Sort'
    },

    dialogs: {
      original: 'Original',
      effective: 'Effective',
      other: 'Other',
      newPrice: 'New Price',
      discountBy: 'Discount by',
    },

    fnBtn: {
      btnName: 'Button Name',
      fillText: 'Fill your text',
      clearBtn: 'Clear Button',
      fns: 'Functions',
      select: 'Select',
      buyback: 'Buyback',
      value: 'Value',
      price: 'Price',
      fillValue: 'Fill your value',
      color: 'Colour',
      selectBtn: 'Select a button to configure',
      selectMergeBtns: 'Select multiple buttons to merge',
      selectSplitBtn: 'Select a button to split',
      mergeMode: 'Merge Mode',
      splitMode: 'Split Mode',
      merge: 'Merge',
      split: 'Split',
      orderFunctions: {
        discountSingleItemDialog: 'Discount single item (dialog)',
        discountSingleItemByPercent: 'Discount single item by %',
        discountSingleItemByAmount: 'Discount single item by €',
        productLookup: 'Product Lookup',
        changePrice: 'Change price',
        quickCash: 'Quick Cash',
        saveOrder: 'Save order',
        pay: 'Pay',
        buybackProduct: 'Buyback Product'
      },
      paymentFunctions: {
        banknote: 'Banknote',
        pay: 'Pay',
        discount: 'Discount',
        cashDrawer: 'Cashdrawer',
      }
    },

    common: {
      date: 'Date',
      datetime: 'Date/Time',
      sales: 'Sales',
      total: 'Total',
      currency: '$',
      currencyCode: "USD",
      countryCode: "US",
      locale: "en-US",
      discount: 'Discount',
      tax: 'Tax',
      subtotal: 'Subtotal',
      asap: 'As soon as possible',
      weekday: {
        monday: 'Monday',
        tuesday: 'Tuesday',
        wednesday: 'Wednesday',
        thursday: 'Thursday',
        friday: 'Friday',
        saturday: 'Saturday',
        sunday: 'Sunday'
      }
    },

    //reports
    report: {
      zNumber: 'Z-Number',
      reportDate: 'Report Date',
      firstOrder: 'First Order',
      lastOrder: 'Last Order',
      totalSales: 'Total Sales',
      xReport: 'X-Report',
      productSold: 'Product Sold',
      printReport: 'Print Report',
      pendingPrintLine1: 'Day {date} is not yet closed.',
      pendingPrintLine2: 'Do you want to run End-of-day on {date}?',
      confirmationPrintZ1: 'Are you sure to print Z-Report',
      confirmationPrintZ2: '(End Of Day)',
      reprintZReport: 'Reprint Z-Report',
      runEndOfDay: 'Run End-of-Day',
      //staff
      staffName: 'Staff Name',
      vouchersSold: 'Vouchers Sold',
      vouchersUsed: 'Vouchers Used',
      returnedTotal: 'Returned Total',
    },

    order: {
      lastPay: 'Last Pay',
      name: 'Name',
      unit: 'Unit',
      quantity: 'Qty',
      each: 'Each',
      savedList: 'Saved List',
    },

    orderHistory: {
      dateTimeSelection: 'Date/time Selection',
      orderNo: 'Order No.',
      promotionalApplied: 'Promotional Applied',
      barcode: 'Barcode',
      amount: 'Amount',
      staff: 'Staff',
      info: 'Info',
      filter: 'Filter'
    },

    payment: {
      balanceDue: 'Balance Due',
      amountTendered: 'Amount Tendered',
      change: 'Change',
      tip: 'Tip',
      selectCustomer: 'Select Customer',
      alertDiscount: 'This order has already applied discount in items'
    },

    settings: {
      deletePrompt: 'Are you sure you want to delete',
      editPayment: 'Edit Payment',
      createPayment: 'Create new Payment',
      createProduct: 'Create new Product',
      favourite: 'Favourite',
      itemIsVoucher: 'Item is a voucher',
      active: 'Active',
      nonRefundable: 'Non-Refundable',
      showOnOrderScreen: 'Show on "Order Screen"',
      manualPrice: 'Manual Price',
      productIdPlaceholder: 'Auto generate',
      productName: 'ProductName',
      barcode: 'Barcode/PLU',
      invoiceLetter: 'Invoice Letter',
      selectedProducts: 'selected product(s)',
      //category
      createCategory: 'Create new Category',
      position: 'Position',
      moveUp: 'Move Up',
      moveDown: 'Move Down',
      //user
      addUser: 'Add New User',
      editUser: 'Edit User',
      userAvatar: 'User Avatar',
      name: 'Name',
      userName: 'User Name',
      passcode: 'Passcode',
      selectAvatar: 'Select User Avatar',
      filter: 'Filter',
      clearAll: 'Clear All',
      viewOwnReport: 'View Own Report',
      viewOtherReport: 'View Others Reports',
      editArticle: 'Edit Article Layout',
      openCashdrawerManually: 'Open Cash Drawer Manually',
      discount: 'Discount',
      cancelInvoice: 'Cancel Invoice',
      accessZReport: 'Access Z-Report',
      itemCancellation: 'Item Cancellation',
      iBtn: 'Employee iButton Key',
      registered: 'Registered!',
      //company
      companyName: 'Company Name',
      address: 'Address',
      tel: 'Telephone',
      taxNo: 'Tax Number',
      logo: 'Logo',
      logoSize: 'Logo Size',
      logoPreview: 'Logo Preview',
      //general
      companyBarcode: 'Barcode',
      showFav: 'Favourite Article',
      virtualKb: 'Virtual Keyboard',
      autoCashdrawer: 'Cashdrawer opens automatically',
      quickFnRows: 'Quick Function Rows',
      beginHour: 'New day starts at',
      //hardware
      thermalPrinter: 'Thermal Printer',
      reset: 'Reset',
      ipAddress: 'IP Address',
      setupPrinter: 'Setup Printer',
      testPrinter: 'Test Printer',
      //payment
      paymentName: 'Name',
      paymentIcon: 'Icon',
      //tax:
      noteLetter: 'Invoice Note Letter'
    },

    //dates
    dates: {
      daysOfWeek: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
      timeFormat: 'HH:mm',
      dateFormat: 'DD/MM/YYYY',
    },

    sidebar: {
      product: 'Product',
      articles: 'Articles',
      category: 'Category',
      productLayout: 'Product Layout',
      reporting: 'Reporting',
      user: 'User',
      settings: 'Settings',
      general: 'General',
      orderScreen: 'Order Screen',
      printTemplate: 'Print Template',
      paymentLayout: 'Payment Layout',
      functionLayout: 'Function Layout',
      hardware: 'Hardware',
      thermalPrinter: 'Thermal Printer',
      pos: 'POS',
      customerDisplay: 'Customer Display',
      a4Printer: 'A4 Printer',
      advancedSettings: 'Advanced settings',
      companyInfo: 'Company Info',
      payment: 'Payment',
      tax: 'Tax',
      license: 'License'
    },

    store: {
      open: 'Open',
      closed: 'Closed',
      today: 'today',
      orderList: 'Order List',
      totalItems: 'Total items',
      note: 'Note',
      payment: 'PAYMENT',
      confirmOrder: 'Confirm Order',
      contactInfo: 'CONTACT INFORMATION',
      orderDetail: 'ORDER DETAILS',
      pickup: 'Pick Up',
      delivery: 'Delivery',
      name: 'Name',
      telephone: 'Telephone',
      address: 'Address',
      street: 'Street',
      houseNo: 'No.',
      zipCode: 'Zip Code',
      deliveryTime: 'Delivery Time',
      pickupTime: 'Pickup Time',
      total: 'Total',
      confirm: 'CONFIRM',
      orderSuccessfully: 'Order Successfully',
      items: 'Items',
      shippingFee: 'Shipping Fee',
      company: 'Company Name',
      waiting1: 'Sending your order to the restaurant...',
      waiting2: 'Please wait while we proceed your order...',
      waiting3: 'The process might take a while...',
      waiting4: 'Hold on! The restaurant might be crowded at the moment...',
      orderMissed: 'Order missed',
      apology: 'We apologize for any convenience caused. You can {0}',
      tryAgain: 'try again!',
      possibleReasons: 'Some possible reasons for this issue',
      reason1: 'The restaurant staffs are currently busy and cannot handle your order quick enough.',
      reason2: 'There might be a serious connectivity issue at the restaurant.',
      callUs: 'For more information, call us directly',
      close: 'Close',
      orderConfirmed: 'Your order is confirmed',
      orderCancelled: 'Sorry, your order has been cancelled!',
      reason: 'Reason',
      emptyCart: 'Your order list is currently empty.',
      minimumWarning: 'Delivery service is not available for orders less than ',
      applyCode: 'Apply coupon code',
      couponCode: 'COUPON CODE',
      apply: 'Apply',
      couponApplied: 'Coupon applied!',
      invalidCoupon: 'Invalid coupon!',
      notApplicable: 'Not applicable for this order!',
      openHours: 'Open hours',
      merchantClose: 'Merchant is temporarily closed',
      merchantClose1: 'The merchant is temporarily closed and will not accept orders until {1} {0}. Please come back after that. We apologize for any inconvenience caused.',
      merchantClose2: 'Das Restaurant ist vorübergehend geschlossen. Wir entschuldigen uns für die Umstände.',
      minimumOrder: 'Minimum order',
      deliveryFee: 'Delivery fee',
      notice: 'Notice',
      allergic: 'Allergic',
      allergicNotice: 'This item may contain food allergens:',
      spicy: 'Spicy',
      spicyNotice: 'This item may contain spicy ingredients!',
      vegeterian: 'Vegeterian',
      vegeterianNotice: 'This item is marked as meat-free and suitable for vegetarians!',
      deliveryTimeWarning: 'Today delivery service is available between ',
      eggs: 'Eggs',
      fish: 'Fish',
      milk: 'Milk',
      celery: 'Celery',
      cereal: 'Cereals containing gluten',
      nuts: 'Nuts',
      peanuts: 'Peanuts',
      sesame: 'Sesame Seeds',
      crustaceans: 'Crustaceans',
      lupin: 'Lupin',
      molluscs: 'Molluscs',
      mustard: 'Mustard',
      soya: 'Soya',
      sulphur: 'Sulphur Dioxide',
      messageConfirm: 'Your order will be sent to the restaurant.',
    },

    paymentProviders: {
      paypal: {
        desc: 'Enable customers to pay by their PayPal accounts or credit/debit cards.',
        balance: 'Balance: ',
        calculating: 'Calculating...',
        note: 'Note:',
        noteContent1: 'Addition fee will be added for each transaction.',
        lastUpdate: 'Last update: ',
        transactionHistoryNotice: 'It takes a maximum of three hours for executed transactions to be added into balance.'
      },
      adyen: {

      }
    }
  }
}
