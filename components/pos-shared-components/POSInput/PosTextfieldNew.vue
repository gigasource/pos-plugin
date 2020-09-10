<script>
  export default {
    name: "PosTextfieldNew",
    injectService: ['PosStore:isMobile'],
    props: {
      value: String,
      label: String,
      placeholder: String,
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
        }
      }
    },
    render() {
      if (this.isMobile) {
        return (
            <g-text-field ref="textfield" outlined={true} vModel={this.internalValue} label={this.label} placeholder={this.placeholder}/>
        )
      }
      return <g-text-field-bs ref="textfield" large={true} class="bs-tf__pos" vModel={this.internalValue} label={this.label} placeholder={this.placeholder}/>
    }
  }
</script>

<style scoped lang="scss">
  .g-tf-wrapper {
    width: calc(100% - 8px);
    margin-right: 4px;
    margin-left: 4px;

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
