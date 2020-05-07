<template>
  <g-btn-bs icon="icon-wlan@20" text-color="#2979FF" v-if="online && webShopConnected">Internet</g-btn-bs>
  <g-btn-bs icon="icon-wlan-error@20" text-color="#FF4452" v-else-if="online && !webShopConnected">Error</g-btn-bs>
  <g-btn-bs icon="icon-wlan-disconnected@20" text-color="#FF4452" height="100%" v-else>No Internet</g-btn-bs>
</template>

<script>
  import axios from 'axios';

  export default {
    name: 'ConnectionStatusBtn',
    injectService: ['PosStore:webShopConnected'],
    data() {
      return {
        online: false
      }
    },
    created() {
      window.addEventListener('offline', () => this.online = false)
      window.addEventListener('online', () => this.online = true)
    },
    mounted() {
      this.online = navigator.onLine

      window.cms.socket.emit('getWebshopUrl', async webshopUrl => {
        this.webshopUrl = webshopUrl

        try {
          await axios.get(`${webshopUrl}/health-check`)
          this.webShopConnected = true
        } catch (e) {
          this.webShopConnected = false
        }
      });
    }
  }
</script>

<style scoped lang="scss">
 .g-btn-bs {
   font-size: 14px;
 }

  .no-internet {
    white-space: nowrap;
    margin: 0;
    padding: 0;
  }
</style>
