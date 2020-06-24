<template>
  <g-dialog v-model="value">
    <div class="dialog-content">
      <div class="dialog-content-title">PayPal transaction capture failed</div>
      <div class="dialog-content-message">
        <div class="mb-1">PayPal transaction was not captured. Please login to your PayPal account to accept customer's payment manually.</div>
        <div>Error details: {{error}}</div>
      </div>
      <div class="dialog-content-buttons">
        <g-btn-bs @click="close" background-color="#536DFE" text-color="white" width="100">OK</g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>
<script>
  export default {
    name: 'dialogPayPalTransactionCaptureFailed',
    props: {
      value: Boolean,
      error: String
    },
    data() {
      return {}
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(v) {
          this.$emit('input', v)
        }
      }
    },
    methods: {
      close() {
        this.internalValue = false
      }
    }
  }
</script>
<style scoped lang="scss">
  .dialog-content {
    width: 500px;
    margin: 0 auto;
    background: white;
    padding: 24px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    &-title {
      font-size: 20px;
      font-weight: 600;
      color: #212121;
      margin-bottom: 24px;
      align-self: flex-start;
    }
  
    &-message {
      font-size: 15px;
      color: #333333;
    }
  
    &-buttons {
      display: inline-flex;
      align-self: flex-end;
      margin-top: 24px;
    }
  }
</style>
