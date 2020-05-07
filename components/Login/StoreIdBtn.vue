<template>
  <g-btn flat :uppercase="false" height="100%" v-if="storeId">ID: {{storeId}}</g-btn>
  <g-btn flat :uppercase="false" height="100%" v-else @click.stop="pair">Pair</g-btn>
</template>

<script>
  export default {
    name: 'StoreIdBtn',
    injectService: ['PosStore:storeId'],
    methods: {
      pair() {
        this.$router.push('/pos-setup')
      }
    }
  }
</script>

<style scoped>

</style>