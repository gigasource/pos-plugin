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
      },
      async updateSkipPairing() {
        const posSettings = await cms.getModel('PosSetting').findOne()
        this.skipPairing = posSettings.skipPairing
      },
      getStoreId() {

      }
    },
    data() {
      return {
        skipPairing: false,
        storeId: ''
      }
    },
    async created() {
      await this.updateSkipPairing()
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
