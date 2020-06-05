<template>
  <div v-if="selfHost" :id="containerId"></div>
</template>

<script>
  // https://developer.paypal.com/docs/checkout/reference/customize-sdk/#query-parameters
  export default {
    name: 'PaypalSmartButton',
    props: {
      // CONTAINER ------
      selfHost: Boolean,
      hostId: String,
      
      // order items
      orderInfo: Object,
      
      // query parameters
      clientId: String,
      merchantId: String,
      currency: String,
      intent: String,
      commit: Boolean,
      vault: Boolean,
      disableFunding: String,
      disableCard: String,
      integrationDate: String,
      debug: Boolean,
      buyerCountry: String,
      locale: String,
      
      // If this prop is true, actions.order.capture() will be invoked in onApprove
      // then 'onFundCaptured' event will be emitted if fund capture succeeded
      // If this prop is false, 'onApprove' event will be emitted
      captureFundImmediately: Boolean,
    },
    data: function () {
      return {
        sdkLoaded: false,
        containerId: this.selfHost ? `ppsb-${new Date().getTime()}` : this.hostId,
      }
    },
    mounted() {
      const sdkHref = this.buildSdkHref()
      let script = document.querySelector(`script[src="${sdkHref}"]`)
      if (!script) {
        this.debug && console.log('Loading Paypal sdk...')
        script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = sdkHref
        script.onload = () => this.sdkLoaded = true
        document.body.appendChild(script)
      } else {
        this.sdkLoaded = true
      }
    },
    watch: {
      orderInfo() {
        this.updatePaypalItemsDebounce()
      },
      sdkLoaded() {
        if (this.sdkLoaded) {
          this.updatePaypalItems()
        }
      }
    },
    created() {
      this.updatePaypalItemsDebounce = _.debounce(this.updatePaypalItems, 200)
    },
    methods: {
      buildSdkHref() {
        const endpoint = 'https://www.paypal.com/sdk/js';
        const qry = {};
        if (!this.clientId) {
          console.error('Missing client id');
          return;
        }
        qry['client-id'] = this.clientId
        this.merchantId && (qry['merchant-id'] = this.merchantId);
        this.currency && this.currency !== "USD" && (qry.currency = this.currency); // default: USD
        this.intent && this.intent !== "capture" && (qry.intent = this.intent); // default: "capture"
        this.commit === false && (qry.commit = this.commit);
        this.vault === false && (qry.vault = this.vault); // default: false
        this.disableFunding && (qry['disable-funding'] = this.disableFunding);
        this.disableCard && (qry['disable-card'] = this.disableCard);
        this.integrationDate && (qry['integration-date'] = this.integrationDate);
        //this.debug && (qry.debug = this.debug);
        this.buyerCountry && (qry['buyer-country'] = this.buyerCountry);
        this.locale && (qry.locale = this.locale);
        const query = Object.keys(qry).map(prop => `${prop}=${qry[prop]}`).join('&');
        const href = `${endpoint}?${query}`;
        this.debug && console.log(href);
        return href
      },
      updatePaypalItems() {
        if (!this.sdkLoaded || !this.orderInfo) {
          console.log('sdk is not loaded or order info is missing')
          return
        }
        
        const _this = this
        let container = document.getElementById(_this.containerId)
        if (!container) {
          console.log('paypal container missing')
        } else {
          container.innerText = ''
          // add new paypal button
          paypal.Buttons({
            locale: 'en_US',
            style: {
              size: 'responsive',
              color:  'gold',
              shape:  'pill',
              label:  'pay',
              height: 40
            },
            createOrder: async function (_, actions) {
              return actions.order.create(_this.orderInfo);
            },
            onApprove: function (data, actions) {
              _this.$emit('onApprove', data, actions)
            }
          }).render(`#${this.containerId}`);
        }
      }
    }
  }
</script>
