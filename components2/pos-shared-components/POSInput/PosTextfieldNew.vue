<script>
  import {isMobile, isIOS} from '../../AppSharedStates';
  import { getCurrentInstance, withScopeId } from 'vue'

  export default {
    name: "PosTextfieldNew",
    props: {
      modelValue: null,
      label: String,
      placeholder: String,
      clearable: Boolean,
      required: Boolean,
      validateOnBlur: Boolean,
      rules: Array,
      disabled: Boolean,
      readonly: Boolean
    },
    data() {
      return {
        listeners: {
          onClick: (e) => this.$emit('click', e),
          onFocus: (e) => this.$emit('focus', e),
        }
      }
    },
    computed: {
      isMobile() {
        return isMobile.value
      },
      isIOS() {
        return isIOS.value
      },
      internalValue: {
        get() {
          if (this.modelValue)
            return '' + this.modelValue
          return ''
        },
        set(val) {
          this.$emit('update:modelValue', val)
        }
      }
    },
    render() {
      const props = {
        label: this.label,
        placeholder: this.placeholder,
        clearable: this.clearable,
        required: this.required,
        rules: this.rules,
        modelValue: this.internalValue,
        disabled: this.disabled
      }
      function renderFn () {
        if (this.isMobile) {
          return (
              <g-text-field ref="textfield" {...{
                ...{outlined: true, ...props, ...this.isIOS && {virtualEvent: this.isIOS}, readOnly: this.readonly}, // props
                ...{'onUpdate:modelValue': (val) => this.internalValue = val, ...this.listeners} //listeners
              }} />
          )
        }
        return <g-text-field-bs ref="textfield" class="bs-tf__pos" {...{
          ...{large: true, ...props, ...this.isIOS && {virtualEvent: this.isIOS}, readonly: this.readonly}, //props
          ...{'onUpdate:modelValue': (val) => this.internalValue = val, ...this.listeners} //listeners
        }} />
      }

      const { type } = getCurrentInstance();
      return withScopeId(type.__scopeId)(renderFn.bind(this))()
    },
    methods: {
      focus() {
        this.$refs.textfield.onFocus()
      }
    }
  }
</script>

<style scoped lang="scss">
  .g-tf-wrapper {
    width: calc(100% - 8px);
    margin-right: 4px;
    margin-left: 4px;
    margin-bottom: 8px;

    :deep(fieldset) {
      border-color: #C9C9C9;
      border-radius: 2px;
    }

    :deep(.g-tf-label) {
      font-weight: bold;
      color: #1D1D26;
    }
  }
</style>
