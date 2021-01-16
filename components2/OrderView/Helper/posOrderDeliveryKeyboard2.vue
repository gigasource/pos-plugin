<script>
export default {
  setup() {
    return () => <div class="delivery-keyboard" style={keyboardStyles}>
      <div class="delivery-keyboard__screen" style={screenStyles}>
        <input class="delivery-keyboard__input" v-model={value}/>
        <g-icon color="#FF4552" class="delivery-keyboard__icon" onClick={clear}>cancel</g-icon>
      </div>
      <g-keyboard v-model={value} items={keyboardItems} template={keyboardTemplate} onSubmit={submit} onEdit={editKeyboard}/>
    </div>


  }
}
</script>

<style scoped lang="scss">
  .delivery-keyboard {
    display: grid;
    background-color: white;
    z-index: 2;

    &__screen {
      display: flex;
      align-items: center;
      background: #EEEEEE;
      border: 1px solid #979797;
      border-radius: 2px;
      padding: 8px;
    }

    &__input {
      flex: 1;
      width: calc(100% - 24px);
      background: transparent;
      color: #1d1d26;
      outline: none;
      font-size: 18px;
    }

    &__icon {
      flex: 0 0 24px;
      cursor: pointer;
    }

    ::v-deep .key {
      border: 1px solid #979797;
      padding: 4px;

      .waves-ripple {
        background-color: rgba(255, 190, 92, 1)
      }
    }
  }
</style>
