<template>
  <section class="franchise-view r">
    <div @click="close" class="abs" style="top: 20px; right: 20px; width: 20px; height: 20px; cursor: pointer">
      <img src="/plugins/pos-plugin/assets/close.svg" draggable="false"/>
    </div>
    <div class="header">Select your nearest restaurants</div>
    <div class="store-cards">
      <store-card v-for="store in stores" :key="store._id" :store="store" class="store-card"/>
    </div>
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
    methods: {
      close() {
        window.parent.postMessage('close-iframe', '*')
      }
    }
  }
</script>
<style scoped lang="scss">
  .franchise-view {
    width: 100%;
    max-width: 1032px;
    background-color: #FFF;
    margin: 30px auto;
    padding: 60px;
    border-radius: 10px;
  }
  
  .header {
    font-weight: bold;
    font-size: 25px;
    margin-bottom: 100px;
    text-align: center;
  }
  
  .store-cards {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-row-gap: 20px;
  }

  @media screen and (max-width: 1080px) {
    .store-cards {
      grid-template-columns: 1fr 1fr !important;
    }
  }
  
  @media screen and (max-width: 640px) {
    .franchise-view {
      padding: 20px;
      padding-top: 40px;
      margin-top: 0;
    }
    
    .header {
      margin-bottom: 50px;
    }
    
    .store-cards {
      grid-template-columns: 1fr !important;
    }
  }
  
  @media screen and (max-width: 359px) {
    .franchise-view {
      padding: 5px;
      padding-top: 40px;
      margin-top: 0;
    }
    
    .store-card {
      padding: 10px 0 !important;
    }
  }
</style>
