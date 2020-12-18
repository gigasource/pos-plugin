<template>
  <g-dialog v-model="internalValue" persistent>
    <div class="dlg">
      <div class="dlg-title">{{ title }}</div>
      <div class="dlg-message">
        <slot></slot>
      </div>
      <div class="dlg-buttons">
        <slot name="actions">
          <g-btn-bs background-color="#2979FF" text-color="white" @click.stop="closeDialog" width="100" style="margin: 0">OK</g-btn-bs>
        </slot>
      </div>
    </div>
  </g-dialog>
</template>
<script>
  export default {
    name: 'dialogCommon',
    props: {
      title: String,
      modelValue: Boolean,
    },
    data: function () {
      return {}
    },
    computed: {
      internalValue: {
        get() {
          return this.modelValue
        },
        set(v) {
          this.$emit('update:modelValue', v)
        }
      }
    },
    methods: {
      closeDialog() {
        this.internalValue = false
      }
    }
  }
</script>
<style scoped lang="scss">
  .dlg {
    width: 500px;
    margin: 0 auto;
    background: white;
    padding: 24px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;

    &-title {
      font-size: 20px;
      font-weight: 600;
      color: #212121;
      margin-bottom: 24px;
      align-self: flex-start;
    }

    &-message {
      font-size: 15px;
      width: 100%;
      color: #333333;
    }

    &-buttons {
      display: inline-flex;
      align-self: flex-end;
      margin-top: 24px;
    }
  }
</style>
