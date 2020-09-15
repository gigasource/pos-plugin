<template>
  <g-dialog v-model="internalValue" width="90%" eager :fullscreen="isMobile">
    <div class="dialog-input col-flex">
      <g-icon v-if="close" @click="internalValue = false" class="close-icon">icon-close@20</g-icon>
      <div class="flex-grow-1 overflow-y">
        <slot name="input" :changeKeyboard="changeKeyboardType">
          <div class="textfield">
            <g-text-field-bs v-model="text" :label="title" :placeholder="placeholder"/>
          </div>
        </slot>
        <slot name="buttons">
          <div class="button" v-if="showButtons">
            <g-btn-bs width="120" border-color="#979797" text-color="#1d1d26" @click="internalValue = false">{{$t('ui.cancel')}}</g-btn-bs>
            <g-btn-bs width="120" background-color="#2979FF" :disabled="!valid" @click="submit">{{$t('ui.ok')}}</g-btn-bs>
          </div>
        </slot>
      </div>
      <div style="max-height: 50%">
        <slot name="keyboard">
          <div class="keyboard" v-if="showKeyboard">
            <pos-keyboard-full @enter-pressed="submit" @change-type="changeKeyboardType" :type="keyboardType"/>
          </div>
        </slot>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: "dialogFormInput",
    injectService: ['PosStore:isMobile'],
    props: {
      value: null,
      showKeyboard: {
        type: Boolean,
        default: true
      },
      close: {
        type: Boolean,
        default: true
      },
      title: String,
      placeholder: String,
      valid: {
        type: Boolean,
        default: true
      },
    },
    data() {
      return {
        text: '',
        keyboardType: 'alphanumeric',
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
        }
      },
      showButtons() {
        return !this.showKeyboard
      }
    },
    methods: {
      changeKeyboardType(val) {
        this.keyboardType = val
      },
      submit() {
        this.$emit('submit')
      }
    },
    watch: {
      value(val) {
        if (!val) this.keyboardType = 'alphanumeric'
      }
    }
  }
</script>

<style scoped lang="scss">
  .dialog-input {
    background-color: #FFFFFF;
    padding: 16px;
    width: 100%;

    .close-icon {
      position: absolute;
      right: 10px;
      top: 10px;
      z-index: 1;
    }

    .textfield {
      margin: 24px 0;
    }

    .button {
      display: flex;
      justify-content: flex-end;
      margin: 24px 0;
    }

    .keyboard {
      background-color: #bdbdbd;
      padding: 0.5rem;
      margin: 0 -16px -16px -16px;
    }
  }
</style>
