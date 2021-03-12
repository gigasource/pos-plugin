<script>
import { genScopeId, internalValueFactory } from '../utils';
import { incorrectPasscode } from './LoginLogic';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

export default {
  setup(props, { emit }) {
    const { t } = useI18n()
    const internalValue = internalValueFactory(props, { emit })
    const rules = computed(() => {
      if (incorrectPasscode.value) {
        return [() => 'incorrect']
      } else {
        return []
      }
    })
    const key = ref(0)
    return genScopeId(() =>
        <g-text-field type="password" v-model={internalValue.value} rules={rules.value} key={key.value} v-slots=
            {{
              'input-message': genScopeId(() => (
                  (incorrectPasscode.value) &&
                  <div class="invalid-passcode-message">
                    <g-icon color="red" size="16px" style="margin-right: 8px">
                      mdi-close-circle
                    </g-icon>
                    <p style="color: #F44336;">
                      {t('login.errorPasscode')}
                    </p>
                  </div>
              ))
            }}/>
    )
  }
}
</script>

<style lang="scss" scoped>
::v-deep .g-tf-input {
  text-align: center;
  font-size: 24px;
  letter-spacing: 12px;
  color: #2196F3;
}

::v-deep .invalid-passcode-message {
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
