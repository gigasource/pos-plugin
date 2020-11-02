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
      order: 'Order',
      payment: 'Payment',
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
      unavaibleArea: 'Delivery service is not available to your area!',
      openHours: 'Open hours',
      merchantClose: 'Merchant is temporarily closed',
      merchantClose1: 'The merchant is temporarily closed and will not accept orders until {1} {0}. Please come back after that. We apologize for any inconvenience caused.',
      merchantClose2: 'The merchant is temporarily closed. We apologize for any inconvenience caused.',
      merchantClose3: 'The merchant is temporarily closed but still accepts online orders at the moment. Your orders will be available for takeaway and delivery after {0}.',
      minimumOrder: 'Minimum order',
      deliveryFee: 'Delivery fee',
      notice: 'Notice',
      productInfo: 'Product Information',
      productInfoWarning: 'Printing errors, mistakes and changes reserved.',
      allergic: 'Allergic',
      allergicNotice: 'This item may contain food allergens:',
      spicy: 'Spicy',
      spicyNotice: 'This item may contain spicy ingredients!',
      vegeterian: 'Vegetarian',
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
      next: 'Next',
      deliveryIn: 'Delivery in {0} minutes',
      pickUpIn: 'Pick up in {0} minutes',
      payByCash: 'Pay By Cash',
      paymentOption: 'PAYMENT OPTIONS',
      notAvailable: 'Not Available',
      zipCodeMinOrder: 'The minimum order value in your area is {0}{1}.',
      orderConfirmation: 'Order Confirmation',
      pickupOnly: 'Pickup only',
      pickupOnlyNotice: 'This item is only available for takeaway.'
    },

    paymentProviders: {
      paypal: {
        desc: 'Enable customers to pay by their PayPal accounts or credit/debit cards.',
        balance: 'Balance: ',
        calculating: 'Calculating...',
        note: 'Note:',
        noteContent1: 'Addition fee will be added for each transaction.',
        lastUpdate: 'Last update: ',
        transactionHistoryNotice: 'It takes a maximum of 3 hours for executed transactions to be added into your balance.'
      },
      adyen: {

      }
    },

    setting: {
      basic: 'Basic',
      serviceOpenHours: 'Service & Open hours',
      menu: 'Menu',
      reservation: 'Reservation',
      deliveryFee: 'Delivery Fee',
      printer: 'Multiple Printer',
      discount: 'Discount',
      storeInfo: 'Store Information',
      basicInfo: 'Basic Info',
      storeName: 'Store Name',
      storePhone: 'Store Phone',
      storeAddress: 'Store Address',
      zipCode: 'Zip code',
      town: 'Town/City',
      country: 'Country',
      embedCode: 'Embed Code',
      copyCode: 'Copy Code',
      generate: 'Generate',
      uploadPhoto: 'Upload Photo',
      storePhoto: 'Store Photo',
      storeLogo: 'Store Logo',
      editPhoto: 'Edit Photo',
      uploadFavicon: 'Upload Favicon',
      faviconMessage: 'Choose a favicon to be displayed',
      openDeliveryHour: 'Open hours & Delivery hours',
      addNewHour: 'Add new',
      save: 'Save',
      delivery: 'Delivery',
      pickup: 'Allow pick-up',
      yes: 'Yes',
      no: 'No',
      requireMinimumOrder: 'Require minimum value {0} for delivery orders',
      orderTimeout: 'Order timeout',
      preview: 'Preview',
      setting: 'Setting',
      newCategory: 'New category',
      newItem: 'New item',
      type: 'Type',
      mandatory: 'Mandatory',
      cancel: 'Cancel',
      choice: 'Choice',
      deliveryHourNote: 'Note: Delivery hours must be within open hours.',
      settings: 'Settings',
      enabled: 'Enabled',
      autoAcceptDevice: 'Auto-accept new devices',
      autoAcceptOrder: 'Auto-accept orders',
      defaultTimeComplete: 'Default time to complete order',
      recommendGSMS: 'We recommend leaving this setting off by default. For more information, please contact your service provider.',
      activeReservation: 'Active reservation',
      incomeReservationSound: 'Incoming reservation notification sound',
      autoRemoveOverdue: 'Automatically remove overdue reservations after (min)',
      maxGuest: 'Maximum guest allowance',
      maxTime: 'Maximum time allowance (days)',
      groupPicture: 'Group picture',
      importCategory: 'Import Categories',
      extraInfo: 'Extra Info',
      edit: 'Edit',
      delete: 'Delete',
      menuSetting: 'Menu settings',
      zipCodeNote: 'Note: You can put zip codes with the same fee in a single line, separated by ";" or ";"',
      acceptOtherZipCode: 'Accept orders with other zip codes',
      otherZipcodeFee: 'Shipping fee for other zip codes',
      distance: 'Distance',
      address: 'Address',
      coordinates: 'Coordinates',
      fee: 'Fee',
      multiplePrinter: 'Multiple Printer',
      useMultiplePrinter: 'Use multiple printer',
      onePrinterNote: 'Leave this setting off if you use only 1 printer',
      printerName: 'Printer Name',
      printerNameNote: 'Note: Printer name must be identical to your POS settings.',
      newPrinter: 'Add New',
      newDiscount: 'Add new discount',
      amount: 'Amount',
      number: 'Number',
      percentage: 'Percentage',
      freeship: 'Free Shipping',
      condition: 'Condition',
      totalValue: 'Total value',
      valueNote1: 'Ticking this option will limit your discount to orders with certain value range.',
      valueNote2: 'MIN or MAX value can be left empty.',
      valueNote3: 'If you want to limit your discount to orders with €10 or more, ticking this option and set MIN value to 10, leaving MAX value empty.',
      timePeriod: 'Time period',
      periodNote1: 'Ticking this option will limit your discount to orders placed in a certain time period.',
      periodNote2: 'Not ticking this option will make your discount always applicable.',
      daysOfWeek: 'Days of the week',
      weekdayNote1: 'Ticking this option will limit your discount to orders placed in a certain days of the week.',
      weekdayNote2: 'Not ticking this option will make your discount applicable everyday during the week.',
      zipcodeNote1: 'Ticking this option will limit your discount to orders in a certain area.',
      zipcodeNote2: 'Not ticking this option will make your discount available to all zip codes.',
      coupon: 'Coupon',
      couponNote: 'Ticking this option will limit your discount to orders with your specified coupon.',
      active: 'Active',
      inactive: 'Inactive',
      paymentSetting: 'Payment setting',
      transaction: 'Transaction',
      activePaypal: 'Active Paypal checkout',
      deactivePaypal: 'Deactive Paypal checkout',
      generateCodeEmbed: 'Generate code to embed online ordering to your website.',
      daysOff: 'Days-off',
      dontDelete: 'Do not delete',
      collapseText: 'Collapse overflow text',
      limitDescription: 'Limit displaying menu description to 2 lines',
      displayItemNo: 'Display item no',
      displayMenuNumber: 'Display menu number on online ordering website.',
      displayItemImage: 'Display item image',
      displayMenuImage: 'Display menu image on online ordering website.',
      seatLimit: 'Seat limit',
      noteForCustomer: 'Note for customers',
      hideEmpty: 'Hide empty time slots',
      sendConfirmEmail: 'Send confirmation email',
      addNote: 'Add note',
      fromTo: 'From/To',
      day: 'Day',
      add: 'Add',
      addDaysoff: 'Add days-off',
      from: 'From',
      to: 'To',
      daysoffNote: 'For a 1-day period, please leave either field empty.',
      daysoffMess: 'Our restaurant is closed today.',
      daysoffMess2: 'Thank you for understanding.',
      desc: 'Description',
      price: 'Price',
      tax: 'Tax',
      minOrder: 'Min order',
      requireMinOrder: 'Require minimum order value for each zipcode',
      distanceNote: 'Note: Shipping service is not available for locations outside of the configured radius.',
      requireMinOrderDistance: 'Require minimum order value for each radius',
      ourService: 'Our services',
      ourMenu: 'Our menu',
      takeAway: 'Take away',
      other: 'Other',
      otherSetting: 'Other Setting',
      deliveryForwarding: 'Delivery Forwarding',
      deliveryOrderForwarding: 'Delivery order forwarding',
      forwardToRestaurant: 'Forward order to restaurant ID',
      forwardNote: 'Forwarded orders will only appear in the destination device. The System only forwards delivery orders.',
      digitalMenuScript: 'Digital menu embed script',
      upload: 'Upload',
      earliestSelectableTime: 'Earliest selectable time',
      preOrderTime: 'Order before open hours',
    },


    menu: {
      feedback: 'Feedback',
      question: 'Are you happy with our food and services?',
      positive: 'Yes, I am',
      negative: 'No, I am not',
      thank: 'Thank you for using our services. ',
      ggReview: 'Spread the love by leaving a review on Google',
      apology: 'We apologize for any bad experience you might have',
      placeholder: 'Leave us a feedback to improve our services.',
      view: 'View',
      restaurantPlus: 'Free Digital Menu powered by Restaurant Plus 2020',
      submit: 'Submit'
    }
  }
}
