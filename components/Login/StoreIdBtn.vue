<template>
  <g-btn-bs v-if="storeId">ID: {{storeId}}</g-btn-bs>
  <g-btn-bs v-else-if="!storeId && skipPairing" @click.stop="pair">Pair</g-btn-bs>
</template>

<script>
  import { storeId, getStoreId } from '../../composition/usePosLogic';
  import { useRouter } from 'vue-router'
  import { ref } from 'vue';

  export default {
    name: 'StoreIdBtn',
    setup() {
      const router = useRouter()
      const skipPairing = ref(false)

      function pair() {
        router.push('/pos-setup')
      }

      async function updateSkipPairing() {
        const posSettings = await cms.getModel('PosSetting').findOne()
        skipPairing.value = posSettings.skipPairing
      }

      updateSkipPairing()

      return {
        skipPairing, storeId, getStoreId, pair, updateSkipPairing
      }
    },
    mounted() {
      this.getStoreId()
    },
    async activated() {
      await this.updateSkipPairing()
      this.getStoreId()
    }
  }
</script>

<style scoped lang="scss">
  .g-btn-bs {
    font-size: 14px;
  }

  @media screen and (max-width: 1023px) {
    .g-btn-bs {
      font-size: 12px;
      padding: 0;
    }
  }
</style>
