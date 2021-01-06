<script>
import { loginKeyboardFactory, loginTextFieldFactory } from './LoginComponentsFactory';
import { getCurrentInstance } from 'vue';

export default {
  name: 'LoginPortals',
  setup() {
    const { type } = getCurrentInstance();
    const scopeId = type.__scopeId

    const { fn: keyboardFn } = loginKeyboardFactory()
    const { fn: tfFn } = loginTextFieldFactory()

    const TextField = tfFn(scopeId)
    const Keyboard = keyboardFn()

    return () => <>
      <TextField/>
      <Keyboard/>
    </>
  }
}
</script>

<style lang="scss" scoped>
::v-deep(.g-tf-input) {
  text-align: center;
  font-size: 24px;
  letter-spacing: 12px;
  color: #2196F3;
}

::v-deep(.invalid-passcode-message) {
  width: 100%;
  font-size: 16px;
  line-height: 20px;
  font-weight: 600;
  bottom: -32px;
  position: absolute;
  display: flex;
  justify-content: center;
}
</style>
