<template>
  <g-dialog v-model="internalValue" :width="width || '90%'" :eager="eager" :fullscreen="isMobile">
    <div :class="['dialog-input', 'col-flex', rotate && 'rotate']">
      <g-icon v-if="close" @click="internalValue = false" class="close-icon">icon-close@20</g-icon>
      <div class=" col-flex flex-grow-1 overflow-y pb-3">
        <div class="flex-grow-1">
          <slot name="input" :changeKeyboard="changeKeyboardType">
            <div class="textfield">
              <g-text-field-bs v-model="text" :label="title" :placeholder="placeholder"/>
            </div>
          </slot>
        </div>
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
            <pos-keyboard-full @enter-pressed="submit" @change-type="changeKeyboardType" :type="keyboardType" :width="keyboardWidth"/>
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
      keyboardType: {
        type: String,
        default: 'alphanumeric'
      },
      keyboardWidth: String,
      width: String,
      rotate: Boolean,
      eager: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        text: '',
        internalKeyboardType: 'alphanumeric',
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
      },
      keyboard: {
        get() {
          return this.internalKeyboardType
        },
        set(val) {
          this.internalKeyboardType = val
          this.$emit('change-keyboard-type', val)
        }
      }
    },
    methods: {
      changeKeyboardType(val) {
        this.internalKeyboardType = val
      },
      submit() {
        this.$emit('submit')
      }
    },
    watch: {
      value(val) {
        if (!val) this.internalKeyboardType = 'alphanumeric'
      },
      keyboardType(val) {
        this.internalKeyboardType = val
      }
    }
  }
</script>

<style scoped lang="scss">
  .dialog-input {
    background-color: #FFFFFF;
    padding: 16px;
    width: 100%;
    position: relative;

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

    .rotate {
      width: 400px;
      height: 580px !important;
      transform: rotate(-90deg) translateX(-100%);
      transform-origin: left top;
    }
  }

  @media screen and (max-height: 599px) {
    .dialog-input {
      padding: 8px;

      .keyboard {
        margin: 0 -8px -8px -8px;

        ::v-deep .key {
          font-size: 18px;
        }
      }
    }
  }
</style>
