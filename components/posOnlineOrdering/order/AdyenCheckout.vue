<template>
  <!-- NOTE FROM ADYEN: If you are using JavaScript frameworks such as Vue or React, make sure that you use references instead of selectors and that you don't re-render the DOM element. -->
  <div>
    <div id="component-container"></div>
  </div>
</template>
<script>
  export default {
    name: 'AdyenCheckout',
    props: {
      // CONTAINER ---
      selfHost: Boolean,
      hostId: String,

      paymentMethodsResponse: Object,
      environment: String,
      locale: String,
      originKey: String,
      amount: Number,
      currency: String,
    },
    data: function () {
      return {  }
    },
    computed: {
      configuration() {
        return {
          locale: this.locale, // "en_US", // The shopper's locale. For a list of supported locales, see https://docs.adyen.com/checkout/components-web/localization-components.
          environment: this.environment, // "test", // When you're ready to accept live payments, change the value to one of our live environments https://docs.adyen.com/checkout/components-web#testing-your-integration.
          originKey: this.originKey, // "YOUR_ORIGIN_KEY", // Your website's Origin Key. To find out how to generate one, see https://docs.adyen.com/user-management/how-to-get-an-origin-key.
          paymentMethodsResponse: this.paymentMethodsResponse, // The payment methods response returned in step 1.
          onSubmit: this.handleOnSubmit,
          showPayButton: true,
          amount: {
            value: this.amount,
            currency: this.currency
          },
          onAdditionalDetails: this.handleOnAdditionalDetails // Your function for handling onAdditionalDetails event
        }
      }
    },
    mounted() {
      // inject script and link
      // note: Adyen provides the SRI hash that you include as the integrity attribute.
      // Refer to our release notes to get the SRI hash for the specific version.
      // https://docs.adyen.com/checkout/release-notes
      let script = document.getElementById('adyen-script')
      if (!script) {
        console.log('script is not exist. try to load new script')
        script = document.createElement('script')
        script.setAttribute('id', 'adyen-script')
        script.setAttribute('integrity', 'sha384-rGkZxBRhUfCECwNuNrllGf8dOpeUsKTMqczAkphoWMne67C32+na/29lUGT3HVOB')
        script.setAttribute('crossorigin', 'anonymous')
        script.onload = () => {
          console.log('script loaded. mount adyen component')
          this.mountAdyenComponent()
        }
        document.body.append(script)
        script.src = 'https://checkoutshopper-test.adyen.com/checkoutshopper/sdk/3.8.1/adyen.js'
      } else {
        this.mountAdyenComponent()
      }
      
      let style = document.getElementById('adyen-style');
      if (!style) {
        style = document.createElement('link')
        style.setAttribute('integrity', 'sha384-y1lKqffK5z+ENzddmGIfP3bcMRobxkjDt/9lyPAvV9H3JXbJYxCSD6L8TdyRMCGM')
        style.setAttribute('crossorigin', 'anonymous')
        style.setAttribute('rel', 'stylesheet')
        style.setAttribute('href', 'https://checkoutshopper-test.adyen.com/checkoutshopper/sdk/3.8.1/adyen.css')
        document.head.append(style)
      }
    },
    methods: {
      mountAdyenComponent() {
        const checkout = new AdyenCheckout(this.configuration);
        const card = checkout.create('dropin').mount('#component-container');
      },
      async handleOnSubmit(state, component) {
        try {
          const response = await this.makePayment(state.data)
          if (response.action) {
            dropin.handleAction(response.action);
          } else {
            this.showFinalResult(response);
          }
        }
        catch (e) {
          throw Error(error);
        }
      },
      async handleOnAdditionalDetails(state, component) {
        try {
          const response = await this.makeDetailsCall(state.data)
          if (response.action) {
            dropin.handleAction(response.action);
          } else {
            this.showFinalResult(response);
          }
        } catch (e) {
          throw Error(error);
        }
      },
      showFinalResult(response) {
        debugger
      },
      async makePayment(data) {
        return (await axios.post('/payment/adyen/payments', { metadata: data })).data
      },
      async makeDetailsCall(data) {
        return (await axios.post('/payment/adyen/payments/details', { metadata: data })).data
      }
    }
  }
</script>
