<template>
  <g-dialog v-model="value" persistent>
    <div class="dlg">
      <div class="dlg-title">Capturing order's transaction</div>
      <div class="dlg-message">We're capturing money for this order. Please wait...</div>
    </div>
  </g-dialog>
</template>
<script>
  export default {
    name: 'dialogOrderTransactionCapturing',
    props: {
      value: Boolean,
      error: String
    },
    data() {
      return {}
    }
  }
</script>
<style scoped lang="scss">
  .dlg {
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
  }
</style>
