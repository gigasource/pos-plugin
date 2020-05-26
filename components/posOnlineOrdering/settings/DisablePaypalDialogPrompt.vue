<template>
  <g-dialog :value="value" @input="cancel">
    <div style="width: 600px; height: 400px; margin:0 auto; background-color: #FFF; border-radius: 5px;padding: 30px;">
      <div style="font-style: normal; font-weight: 600; font-size: 24px;">Disable PayPal Checkout</div>
      <div style="height: 200px; width: 500px; margin: 30px auto;">
        <div>Disable PayPal Checkout will prevent your customer to order using PayPal account, debit/credit card. Are you sure you want to disable this option?</div>
        <div style="color: #616161">
          <div class="mt-4">Note:</div>
          <div style="font-size: 14px; font-style: italic">Your pending balance is automatically transfered to your bank account on the first day of the following month.</div>
        </div>
        
        
      </div>
      <div class="row-flex justify-end">
        <g-btn-bs width="100" background-color="#536DFE" text-color="#FFF" @click="cancel">Cancel</g-btn-bs>
        <g-btn-bs width="100" background-color="#F2F2F2" @click="ok">OK</g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>
<script>
  export default {
    name: 'DisablePaypalDialogPrompt',
    props: {
      value: Boolean
    },
    data: function () {
      return {}
    },
    computed: {},
    methods: {
      close() {
        this.$emit('input', false)
      },
      cancel() {
        this.close()
      },
      ok() {
        this.$emit('submit')
        this.close()
      }
    }
  }
</script>
<style scoped>
</style>
