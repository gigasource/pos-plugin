<template>
  <g-btn flat :uppercase="false" height="100%" v-if="storeId">ID: {{storeId}}</g-btn>
  <g-btn flat :uppercase="false" height="100%" v-else-if="!storeId && skipPairing" @click.stop="pair">Pair</g-btn>
  <g-btn flat :uppercase="false" height="100%" v-else></g-btn>
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
