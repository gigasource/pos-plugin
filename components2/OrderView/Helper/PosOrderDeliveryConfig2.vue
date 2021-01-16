<script>
export default {
  setup() {
    return () => <div class="delivery-config">
      <div class="delivery-config__title">
        Configuration
      </div>
      <div class="row-flex flex-grow-1">
        <div class="col-6">
          <div class="row-flex align-items-center mb-2">
            <p class="fw-600">Delivery Menu</p>
            <g-btn-bs background-color="#1271FF" onClick={fetchMenu}>Fetch</g-btn-bs>
          </div>
          <div class="mb-2 fw-600">Delivery keyboard</div>
          <div class="row-flex align-items-center mb-2">
            <p class="mr-2">External rows</p>
            <input-number width="148" modelValue={keyboardDeliveryConfig.length} onUpdate:modelValue={changeExtraRows}/>
          </div>
        </div>
        <div class="col-6 col-flex h-100">
          <g-spacer/>
          <pos-order-delivery-keyboard key={dialog} mode="edit" keyboardConfig={keyboardDeliveryConfig} onEdit:keyboard={openDialogEdit}/>
        </div>
      </div>
      <dialog-text-filter v-model={dialog} label="Enter key" onSubmit={changeKeyboardExtension}/>
    </div>
  }
}
</script>

<style scoped lang="scss">
  .delivery-config {
    padding: 24px;
    height: 100%;
    display: flex;
    flex-direction: column;

    &__title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
    }
  }
</style>
