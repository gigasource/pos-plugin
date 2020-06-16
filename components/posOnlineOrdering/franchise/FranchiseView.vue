<template>
  <section class="franchise-view">
    <store-card v-for="store in stores" :key="store._id" :store="store"/>
  </section>
</template>
<script>
  import StoreCard from './StoreCard';
  export default {
    name: 'FranchiseView',
    components: { StoreCard },
    props: {},
    data: function () {
      return {
        stores: []
      }
    },
    async created() {
      const storeGroupId = this.$route.params.id
      if (!storeGroupId) {
        alert('Invalid store!')
        return;
      }
      
      const storeGroup = await cms.getModel('StoreGroup').findOne({_id: storeGroupId})
      if (storeGroup) {
        const stores = await cms.getModel('Store').find({ groups: { $elemMatch: { $eq: storeGroup } } })
        this.stores.splice(0, 0, ...stores)
      } else {
        alert('Invalid store');
      }
    },
    computed: {},
    methods: {}
  }
</script>
<style scoped lang="scss">
  .franchise-view {
    background-color: #FFF;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }

  @media screen and (max-width: 1080px) {
    .franchise-view {
      grid-template-columns: 1fr 1fr !important;
    }
  }
  
  @media screen and (max-width: 640px) {
    .franchise-view {
      grid-template-columns: 1fr !important;
    }
  }
</style>
