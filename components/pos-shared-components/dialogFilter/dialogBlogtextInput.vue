<template>
  <g-dialog v-model="internalValue" width="90%" eager>
    <div class="wrapper">
      <g-icon @click="internalValue = false" svg size="20" class="icon">icon-close</g-icon>
      <div class="screen">
        <p class="fw-700">{{label}}</p>
        <g-textarea :model-value="screenValue" @update:modelValue="e => updateValue(e)" no-resize outlined rows="5" :placeholder="`${label}...`" ref="textarea"/>
        <div class="buttons">
          <g-btn :uppercase="false" text @click="internalValue = false" outlined width="120" class="mr-2">
            {{$t('ui.cancel')}}
          </g-btn>
          <g-btn :uppercase="false" text @click="submit" backgroundColor="#2979FF" text-color="#FFFFFF" width="120">
            {{$t('ui.ok')}}
          </g-btn>
        </div>
      </div>
      <div class="keyboard">
        <pos-keyboard-full @enter-pressed="enter"/>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  import { nextTick } from 'vue';

  export default {
    name: 'dialogBlogtextInput',
    props: {
      label: null,
      modelValue: null,
      defaultValue: {
        type: String,
        default: ''
      },
    },
    data() {
      return {
        screenValue: '',
        enterNo: {
          input: 0,
          keyboard: 0
        }
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.modelValue || false
        },
        set(value) {
          this.$emit('update:modelValue', value)
        }
      },
    },
    methods: {
      async submit() {
        this.$emit('submit', this.screenValue);
        this.internalValue = false;
      },
      enter() {
        this.enterNo.keyboard++
      },
      updateValue(e) {
        if(this.enterNo.keyboard === this.enterNo.input)
          this.screenValue = e
        else {
          this.screenValue = e + '\n'
          this.enterNo.input++
        }
      }
    },
    watch: {
      internalValue(val) {
        if (val) {
          this.screenValue = this.defaultValue;
          nextTick(() => {
            setTimeout(() => {
              this.$refs['textarea'].onFocus()
            }, 200)
          })
        }
        this.enterNo = {
          input: 0,
          keyboard: 0
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .wrapper {
    background-color: #FFFFFF;
    padding: 16px;
    width: 100%;
    overflow: scroll;

    .icon {
      float: right;
    }
  }

  .bs-tf-wrapper {
    width: 50%;

    ::v-deep .bs-tf-label {
      margin-bottom: 16px;
      font-size: 16px;
      line-height: 20px;
      font-weight: 700;
      color: #1d1d26;
    }
  }

  .buttons {
    height: 96px;
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
    height: 236px;
    background-color: #BDBDBD;
    padding: 16px;
    margin: 0 -16px -16px -16px;
  }

  .g-textarea {
    width: 500px;
    margin: 8px 0;

    ::v-deep fieldset {
      border-color: #9e9e9e;
      border-width: 1px;
      background: white;

      textarea {
        padding: 12px 16px;
      }
    }
  }
</style>
