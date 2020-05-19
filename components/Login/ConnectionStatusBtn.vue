<template>
  <div>
    <g-btn-bs icon="icon-wlan@20" text-color="#2979FF" v-if="online && webShopConnected">Internet</g-btn-bs>
    <g-btn-bs icon="icon-wlan-error@20" text-color="#FF4452" v-else-if="online && !webShopConnected">Error</g-btn-bs>
    <g-btn-bs class="no-internet" icon="icon-wlan-disconnected@20" text-color="#FF4452" height="100%" v-else>No Internet</g-btn-bs>
  </div>
</template>

<script>

  export default {
    name: 'ConnectionStatusBtn',
    injectService: ['PosStore:(webShopConnected,online)'],
    mounted() {
      this.online = navigator.onLine
    }
  }
</script>

<style scoped lang="scss">
 .g-btn-bs {
   font-size: 14px;
   padding: 0 8px;
   height: 100%;
 }

  .no-internet {
    white-space: nowrap;
    margin: 0;
    padding: 0;
  }
</style>
