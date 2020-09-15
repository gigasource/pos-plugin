<template>
  <g-btn-bs v-if="storeId">ID: {{storeId}}</g-btn-bs>
  <g-btn-bs v-else-if="!storeId && skipPairing" @click.stop="pair">Pair</g-btn-bs>
</template>

<script>
  export default {
    name: 'StoreIdBtn',
    injectService: ['PosStore:(storeId, getStoreId)'],
    methods: {
      pair() {
        this.$router.push('/pos-setup')
      }
    },
    data() {
      return {
        skipPairing: false
      }
    },
    created() {
      const posSettings = cms.getList('PosSetting')[0]
      this.skipPairing = posSettings.skipPairing
    },
    mounted() {
      this.getStoreId()
    },
    activated() {
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
