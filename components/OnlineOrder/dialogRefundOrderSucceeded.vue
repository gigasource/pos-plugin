<template>
  <g-dialog v-model="value" persistent>
    <div class="dlg">
      <div class="dlg-title">Refund order</div>
      <div class="dlg-message">A refund for this order has been processed.</div>
      <div class="dlg-buttons">
        <g-btn-bs background-color="#2979FF" text-color="white" @click="$emit('input',false)">OK</g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>
<script>
  export default {
    name: 'dialogRefundOrderSucceeded',
    props: {
      value: Boolean,
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
  
    &-buttons {
      display: inline-flex;
      align-self: flex-end;
      margin-top: 24px;
    }
  }
</style>
