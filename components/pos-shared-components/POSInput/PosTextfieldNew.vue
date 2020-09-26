<script>
  export default {
    name: "PosTextfieldNew",
    injectService: ['PosStore:isMobile'],
    props: {
      value: null,
      label: String,
      placeholder: String,
      clearable: Boolean,
      required: Boolean,
      validateOnBlur: Boolean,
      rules: Array,
      disabled: Boolean
    },
    data() {
      return {
        listeners: {
          click: (e) => this.$emit('click', e),
          focus: (e) => this.$emit('focus', e),
        }
      }
    },
    computed: {
      internalValue: {
        get() {
          return '' + this.value
        },
        set(val) {
          this.$emit('input', val)
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
        value: this.internalValue,
        disabled: this.disabled
      }

      if (this.isMobile) {
        return (
            <g-text-field ref="textfield" {...{
              props: { outlined: true, ...props},
              on: { input: (val) => this.internalValue = val, ...this.listeners }
            }} />
        )
      }
      return <g-text-field-bs ref="textfield" class="bs-tf__pos" {...{
        props: { large: true, ...props},
        on: { input: (val) => this.internalValue = val, ...this.listeners }
      }} />
    }
  }
</script>

<style scoped lang="scss">
  .g-tf-wrapper {
    width: calc(100% - 8px);
    margin-right: 4px;
    margin-left: 4px;
    margin-bottom: 8px;

    ::v-deep {
      fieldset {
        border-color: #C9C9C9;
        border-radius: 2px;
      }

      .g-tf-label {
        font-weight: bold;
        color: #1D1D26;
      }
    }
  }
</style>
