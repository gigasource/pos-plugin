<template>
  <div class="background">
    <g-icon size="20" @click="close" class="icon-close">icon-close</g-icon>
    <section class="franchise-view r">
      <div v-if="stores && logos && logos.length > 0" class="logo">
        <g-slideshow style="background-color: transparent" v-model="logos" />
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
  import GSlideshow from "../../../../../backoffice/pos-vue-framework/src/components/GSlideshow/GSlideshow";

  export default {
    name: 'FranchiseView',
    components: { StoreCard, GSlideshow },
    props: {},
    data: function () {
      return {
        stores: [],
        logos: []
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
      this.logos = stores.map(store => ({
        src: getCdnUrl(store.logoImageSrc),
        type: 'image',
        transition: 'slideRightToLeft',
        duration: 5000
      })).filter(logo => !!logo.src)
    },
    computed: {

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
    width: 60%;
    max-width: 1140px;
    align-self: center;
    position: relative;
  }

  .icon-close {
    position: absolute;
    top: 20px;
    right: 20px;
  }

  .logo {
    position: relative;
    width: 100%;
    height: 150px;

    ::v-deep img {
      object-fit: unset;
      max-width: 100%;
      width: auto;
      margin-left: 50%;
      transform: translateX(-50%);
    }
  }

  .franchise-view {
    width: 100%;
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
    .background {
      width: 100%;
    }

    .franchise-view {
      padding: 36px 8px;
      margin-top: 0;
    }
  }
</style>
