<template>
  <g-dialog v-model="internalValue" width="90%" eager>
    <div class="dialog-input">
      <g-icon v-if="close" @click="internalValue = false" class="close-icon">icon-close@20</g-icon>
      <slot name="input" :changeKeyboard="changeKeyboardType">
        <div class="textfield">
          <g-text-field-bs v-model="text" :label="title" :placeholder="placeholder"/>
        </div>
      </slot>
      <slot name="buttons">
        <div class="button" v-if="showButtons">
          <g-btn-bs width="120" border-color="#979797" text-color="#1d1d26" @click="internalValue = false">{{$t('ui.cancel')}}</g-btn-bs>
          <g-btn-bs width="120" background-color="#2979FF" :disabled="!valid" @click="$emit('submit')">{{$t('ui.ok')}}</g-btn-bs>
        </div>
      </slot>
      <slot name="keyboard">
        <div class="keyboard" v-if="showKeyboard">
          <pos-keyboard-full @enter-pressed="$emit('save')" @change-type="changeKeyboardType" :type="keyboardType"/>
        </div>
      </slot>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: "dialogFormInput",
    props: {
      value: null,
      showButtons: {
        type: Boolean,
        default: true
      },
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
        keyboardType: 'alphanumeric'
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
      }
    },
    methods: {
      changeKeyboardType(val) {
        this.keyboardType = val
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
      float: right;
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
      padding: 16px;
      margin: 0 -16px -16px -16px;
    }
  }
</style>
