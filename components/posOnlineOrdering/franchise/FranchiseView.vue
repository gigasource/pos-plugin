<template>
  <div class="background">
    <section class="franchise-view r">
      <div v-if="mainStore && mainStore.logoImageSrc" class="logo">
        <img alt :src="cdnStoreLogoImage"/>
      </div>
      <div @click="close" class="abs" style="top: 20px; right: 20px; width: 20px; height: 20px; cursor: pointer">
        <img alt src="/plugins/pos-plugin/assets/close.svg" draggable="false"/>
      </div>
      <div class="tilte">Please select a restaurant</div>
      <div class="store-cards">
        <store-card v-for="store in stores" :key="store._id" :store="store" class="store-card"/>
      </div>
    </section>
  </div>
</template>

<script>
  import StoreCard from './StoreCard';
  import { getCdnUrl } from '../../Store/utils';

  export default {
    name: 'FranchiseView',
    components: { StoreCard },
    props: {},
    data: function () {
      return {
        stores: [],
        mainStore: null
      }
    },
    async created() {
      const clientDomain = this.$route.params.id
      if (!clientDomain) {
        alert('Invalid franchise!')
        return;
      }

      const stores = await cms.getModel('Store').find({ clientDomain })
      this.stores.splice(0, 0, ...stores)
    },
    computed: {
      cdnStoreLogoImage() {
        return this.mainStore.logoImageSrc && getCdnUrl(this.mainStore.logoImageSrc || '/plugins/pos-plugin/assets/images/logo.png')
      }
    },
    methods: {
      close() {
        window.parent.postMessage('close-iframe', '*')
      }
    }
  }
</script>
<style scoped lang="scss">
  .background {
    background: white url("../../../assets/images/franchise-bg.png");
    background-size: cover;
    min-height: 100vh;
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;

    & > img {
      max-width: 150px;
    }
  }

  .franchise-view {
    width: 100%;
    max-width: 1032px;
    margin: 36px auto;
    padding: 0 36px;
  }

  .tilte {
    font-weight: bold;
    font-size: 16px;
    margin-top: 32px;
    margin-bottom: 20px;
  }

  @media screen and (max-width: 640px) {
    .franchise-view {
      padding: 36px 8px;
      margin-top: 0;
    }
  }
</style>
