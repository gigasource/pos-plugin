<script>
import { withModifiers, ref, onBeforeMount } from 'vue'
import { useI18n } from 'vue-i18n';
import { GBtnBs, GIcon, GTextFieldBs } from '../../../../backoffice/pos-vue-framework';
import dialogNumberFilter from '../../components/pos-shared-components/dialogFilter/dialogNumberFilter';
export default {
  props: {
    values: Array,
    allowCustom: Boolean,
    modelValue: null,
    defaultValue: null
  },
  components: [GBtnBs, GTextFieldBs, dialogNumberFilter, GIcon],
  setup(props, { emit }) {
    const { t } = useI18n()
    const values = ref(props.values || [])
    const modelValue = ref(props.modelValue)
    const defaultValue = ref(props.defaultValue)
    const allowCustom = ref(props.allowCustom)
    const inputValue = ref((!values.value.includes(modelValue.value) && modelValue.value) || '')
    const dialog = ref(false)
    const inputRef = ref(null)
    function pickValue(val) {
      if (allowCustom.value) {
        inputValue.value = null
      }
      emit('update:modelValue', val)
    }
    function pickCustomValue(val) {
      emit('update:modelValue', +val)
    }
    function isValueSelected(val) {
      return modelValue === val
    }
    function changeValue(val) {
      inputValue.value = +val
      pickCustomValue(val)
    }
    onBeforeMount(() => {
      if (!modelValue.value && defaultValue.value) emit('update:modelValue', defaultValue.value)

    })

    return () =>
        <div class="picker-wrapper">
          {values.value.map(item =>
              <slot name="item" item={item} select={pickValue} isSelected={isValueSelected}>
                <g-btn-bs onClick={withModifiers(() => pickValue(item), ['stop'])} class={['mb-1', isValueSelected(item) && 'selected']} border-color="#C4C4C4" text-color="black" width="40" height="30">
                  {item}
                </g-btn-bs>
              </slot>
          )}
          {
            (allowCustom) &&
            <g-text-field-bs ref={inputRef} placeholder={t('onlineOrder.customTime')} modelValue={inputValue.value} onUpdate:modelValue={pickCustomValue} v-slots={{
              'append-inner': () =>
                  <g-icon style="cursor: pointer" onClick={() => dialog.value = true}>
                    icon-keyboard
                  </g-icon>
            }}>
            </g-text-field-bs>
          }
          <dialog-number-filter v-model={dialog.value} label="Custom time" onSubmit={changeValue}></dialog-number-filter>
        </div>
  }
}
</script>

<style scoped lang="scss">
.picker-wrapper {
  .selected {
    background: #E3F2FD !important;
    border: 1px solid #90CAF9 !important;
  }

  .bs-tf-wrapper {
    margin: 0 8px;
    width: calc(100% - 16px);

    ::v-deep .bs-tf-input {
      width: 100%;
      font-size: 14px;

      &::placeholder {
        font-size: 14px;
      }
    }
  }
}
</style>
