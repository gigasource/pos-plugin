<template>
  <g-dialog v-model="value">
    <div class="dialog-content">
      <div class="title">PayPal transaction capture failed</div>
      <div class="dialog-body">
        {{error}}
      </div>
      <div class="actions">
        <g-btn-bs @click="close" background-color="" text-color="">OK</g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>
<script>
  export default {
    name: 'dialogPayPalTransactionCaptureFailed',
    props: {
      value: Boolean,
      error: String
    },
    data() {
      return {}
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(v) {
          this.$emit('input', v)
        }
      }
    },
    methods: {
      close() {
        this.internalValue = false
      }
    }
  }
</script>
<style scoped>
</style>
