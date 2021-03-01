<script>
import { withModifiers, ref, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n';
import { GBtnBs, GIcon, GTextFieldBs } from '../../../../backoffice/pos-vue-framework';
import dialogNumberFilter from '../pos-shared-components/dialogFilter/dialogNumberFilter';
import { genScopeId } from '../utils';
export default {
  props: {
    values: Array,
    allowCustom: Boolean,
    modelValue: null,
    defaultValue: null
  },
  components: [GBtnBs, GTextFieldBs, dialogNumberFilter, GIcon],
  setup(props, { emit, slots }) {
    const { t } = useI18n()
    const inputValue = ref((!props.values.includes(props.modelValue) && props.modelValue) || '')
    const dialog = ref(false)
    const inputRef = ref(null)

    function pickValue(val) {
      if (props.allowCustom) {
        inputValue.value = null
      }
      emit('update:modelValue', val)
    }
    function pickCustomValue(val) {
      emit('update:modelValue', +val)
    }
    function isValueSelected(val) {
      return props.modelValue === val
    }
    function changeValue(val) {
      inputValue.value = +val
      pickCustomValue(val)
    }

    onMounted(() => {
      nextTick(() => {
        if (!props.modelValue && props.defaultValue) {
          emit('update:modelValue', props.defaultValue)
        }
      })
    })

    return genScopeId(() =>
        <div class="picker-wrapper">
          {props.values.map(item => (slots.item && slots.item({ item, select: pickValue, isSelected: isValueSelected })) ||
              <g-btn-bs onClick={withModifiers(() => pickValue(item), ['stop'])}
                        class={['mb-1', isValueSelected(item) && 'selected']}
                        border-color="#C4C4C4" text-color="black"
                        width="40" height="30">
                {item}
              </g-btn-bs> )}
          { props.allowCustom &&
            <g-text-field-bs ref={inputRef} placeholder={t('onlineOrder.customTime')}
                             modelValue={inputValue.value} onUpdate:modelValue={pickCustomValue} v-slots={{
              'append-inner': () => <g-icon style="cursor: pointer" onClick={() => dialog.value = true}>icon-keyboard</g-icon>
            }}/>
          }
          <dialog-number-filter v-model={dialog.value} label="Custom time" onSubmit={changeValue}/>
        </div>
    )
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
