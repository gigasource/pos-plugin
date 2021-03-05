<script>
import { genScopeId, internalValueFactory } from '../../utils';
import { isIOS, isMobile } from '../../AppSharedStates';
import { execGenScopeId } from '../../utils';
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n';

export default {
  name: 'dialogNumberFilter',
  props: {
    label: null,
    modelValue: null,
    rules: Array,
  },
  emits: ['update:modelValue', 'submit'],

  setup(props, { emit }) {
    const { t } = useI18n()
    const internalValue = internalValueFactory(props, { emit })
    const screenValue = ref('')

    function submit() {
      emit('submit', screenValue.value);
      internalValue.value = false;
    }
    watch(() => internalValue.value, () => {
      screenValue.value = ''
    })
    return genScopeId(() =>
        <g-dialog v-model={internalValue.value} width="50%" eager={!isIOS.value} fullscreen={isMobile.value}>
          {execGenScopeId(() => <div class="wrapper">
            <g-icon onClick={() => internalValue.value = false} svg size="20" class="icon">
              icon-close
            </g-icon>
            <div class="screen">
              <g-text-field-bs class="bs-tf__pos" v-model={screenValue.value} large label={props.label} rules={props.rules} readonly virtualEvent={isIOS.value}/>
              <div class="buttons">
                <g-btn uppercase={false} text onClick={() => internalValue.value = false} outlined width="120" class="mr-2">
                  {t('ui.cancel')}
                </g-btn>
                <g-btn uppercase={false} text onClick={submit} backgroundcolor="#2979FF" text-color="#FFFFFF" width="120">
                  {t('ui.ok')}
                </g-btn>
              </div>
            </div>
            <div class="keyboard">
              <pos-numpad v-model={screenValue.value}/>
            </div>
          </div>)}
        </g-dialog>)
  }
}
</script>

<style scoped lang="scss">
.wrapper {
  width: 100%;
  background-color: #FFFFFF;
  padding: 16px;
  overflow: scroll;
  position: relative;
  display: flex;
  flex-direction: column;

  .icon {
    position: absolute;
    top: 16px;
    right: 16px;
  }

  .screen {
    flex: 1;
    padding-bottom: 16px;
  }
}

.bs-tf-wrapper {
  ::v-deep .bs-tf-label {
    margin-bottom: 16px;
    font-size: 16px;
    line-height: 20px;
    font-weight: 700;
    color: #1d1d26;
  }

  ::v-deep .bs-tf-input--fake-caret {
    left: 12px;
    right: 12px;
  }
}

.buttons {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 4px;

  .g-btn__outlined {
    border: 1px solid #979797;
    color: #1d1d26;
  }
}

.keyboard {
  background-color: #BDBDBD;
  padding: 20px 125px;
  margin: 0 -16px -16px -16px;

  .keyboard__template {
    height: 100%;
  }
}
</style>
