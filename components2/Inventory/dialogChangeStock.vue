<script>
export default {
  setup() {
    return () => <>
      <g-dialog v-model={internalValue}>
        <div class="dialog">
          <div class="dialog-title">
            {t('inventory.addRemoveStock')} </div>
          <g-icon size="16" class="dialog-icon--close" onClick={() => internalValue = false}>
            icon-close
          </g-icon>
          <div class="dialog-content">
            <p>
              <b>
                {t('inventory.item')}: </b>
              {name} </p>
            <p>
              <b>
                {t('inventory.currentStock')}: </b>
              {$filters.formatCurrency(stock)} </p>
            <p>
              <b>
                {t('inventory.newStock')}: </b>
              <span style={{ ...mode === 'add' && { color: '#1271FF' }, ...mode === 'remove' && { color: '#FF4452' } }}>
                {$filters.formatCurrency(newStock)} </span>
            </p>
            <div class="dialog-content__action">
              <div class={['btn', mode === 'add' && 'btn--blue']} onClick={() => mode = 'add'}>
                <g-icon color="white">
                  add
                </g-icon>
              </div>
              <div class={['btn', mode === 'remove' && 'btn--red', !removeable && 'disabled']} onClick={() => mode = 'remove'}>
                <g-icon color="white">
                  remove
                </g-icon>
              </div>
              <g-text-field-bs ref={textfield} rules={rules} modelValue={change} onUpdate:modelValue={changeValue}>
              </g-text-field-bs>
            </div>
            {
              (mode === 'remove') ?
                  <g-select class="dialog-content__reason" text-field-component="GTextFieldBs" items={reasons} v-model={reason} placeholder="Reason (Optional)">
                  </g-select>
                  :

                  <div class="dialog-content__reason" style="height: 38px"></div>
            }
          </div>
          <div class="dialog-keyboard">
            <pos-keyboard-full width="100%" type="numeric" onEnterPressed={submit}>
            </pos-keyboard-full>
          </div>
        </div>
      </g-dialog>
    </>
  }
}
</script>

<style scoped lang="scss">
.dialog {
  width: 500px;
  margin-left: auto;
  margin-right: auto;
  background-color: white;
  padding: 16px;
  position: relative;
  overflow: auto;
  border-radius: 2px;

  &-title {
    font-size: 20px;
    line-height: 25px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  &-icon--close {
    position: absolute;
    top: 16px;
    right: 16px;
  }

  &-content {
    p {
      font-size: 16px;
      line-height: 20px;
      margin: 8px 0;
    }

    .btn {
      flex: 0 0 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #9e9e9e;
      border-radius: 4px;
      margin-right: 8px;

      &--blue {
        background-color: #1271FF;
      }

      &--red {
        background-color: #ff4552;
      }
    }

    .bs-tf-wrapper,
    .g-select ::v-deep .bs-tf-wrapper {
      margin: 0;
      width: 100%;

      ::v-deep input {
        outline: none;
      }
    }

    &__action {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }

    &__reason {
      margin-bottom: 8px;
    }
  }

  &-keyboard {
    background: #bdbdbd;
    padding: 4px;
    border-radius: 2px;
  }
}

@media screen and (max-height: 599px) {
  .dialog {
    width: 400px;
    padding: 12px;

    &-title {
      font-size: 18px;
      line-height: 22px;
    }

    &-content {

      p {
        font-size: 14px;
        line-height: 18px;
        margin: 4px 0;
      }

      &__action {
        margin-bottom: 4px;
      }

      &__reason {
        margin-bottom: 4px;
      }
    }

    &-keyboard {
      ::v-deep .key {
        font-size: 16px !important;
      }
    }
  }
}
</style>
