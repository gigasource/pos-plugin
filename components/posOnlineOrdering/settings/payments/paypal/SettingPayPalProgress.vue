<template>
  <g-dialog v-model="value" persistent>
    <div style="background-color: #FFF; min-width: 400px; min-height: 300px; margin: 0 auto; width: 400px; border-radius: 5px; text-align: center; padding: 20px; display: flex; flex-direction: column">
      <g-spacer/>
      <div v-if="disabled">It'll take a minute to complete the setup.</div>
      <div style="font-size: 20px; color: #414141;">{{progress}}</div>
      <g-spacer/>
      <div>
        <g-btn-bs background-color="#536DFE" text-color="#FFF" width="120" :disabled="disabled" @click="close">OK</g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>
<script>
  export default {
    name: 'SettingPayPalProgress',
    props: {
      value: Boolean,
      progress: String
    },
    data: function () {
      return {}
    },
    computed: {
      disabled() {
        return this.progress !== 'completed'
      }
    },
    methods: {
      close() {
        location.href = location.origin + location.pathname
      }
    }
  }
</script>
<style scoped>
</style>
