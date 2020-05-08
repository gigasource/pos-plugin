<template>
  <g-btn flat :uppercase="false" height="100%" v-show="storeId">ID: {{storeId}}</g-btn>
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
    mounted() {
      this.getStoreId()
    }
  }
</script>

<style scoped>

</style>