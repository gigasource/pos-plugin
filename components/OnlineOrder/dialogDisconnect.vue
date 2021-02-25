<template>
  <g-dialog v-model="internalValue" width="40%" eager>
    <div class="dialog">
      <div class="dialog-title">Disconnect</div>
      <img alt src="/plugins/pos-plugin/assets/disconnect.svg"/>
      <div class="dialog-message">
        Are you sure you want to disconnect this device?
      </div>
      <div class="dialog-buttons">
        <g-btn-bs width="100" text-color="#424242" @click="internalValue = false">No</g-btn-bs>
        <g-btn-bs width="100" background-color="#536DFE" text-color="white" @click="disconnect">Yes</g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: "dialogDisconnect",
    props: {
      modelValue: null
    },
    computed: {
      internalValue: {
        get() {
          return this.modelValue
        },
        set(val) {
          this.$emit('update:modelValue', val)
        }
      }
    },
    methods: {
      disconnect() {
        this.$emit('confirm')
        this.internalValue = false
      }
    }
  }
</script>

<style scoped lang="scss">
  .dialog {
    width: 100%;
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
      color: #333333;
    }

    &-buttons {
      display: inline-flex;
      align-self: flex-end;
      margin-top: 24px;
    }
  }
</style>
