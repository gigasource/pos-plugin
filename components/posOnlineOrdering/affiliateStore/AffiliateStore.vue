<template>
  <div class="affiliate">
    <div class="affiliate-header">
      <div class="affiliate-header__content">
        <img alt src="/plugins/pos-plugin/assets/images/logo-company.png"/>
        <div class="affiliate-header__title">Discover restaurants around you</div>
        <div class="affiliate-header__subtitle">Order and have food delivered</div>
        <div class="affiliate-header__search">
          <input type="text" placeholder="Enter restaurant name, address, zipcode" v-model="searchText"/>
          <g-btn-bs style="margin: 0" large rounded width="120" background-color="#1271FF" @click="findStore">Find</g-btn-bs>
        </div>
      </div>
    </div>
    <div class="affiliate-content">
      <store-item v-for="(store, i) in displayStores" :store="store" :key="i"/>
      <div class="affiliate-content__load" v-if="length < stores.length" @click="loadMore">Load more</div>
    </div>
    <div class="affiliate__footer">
      <div class="fs-small-2">Copyright © 2020 Restaurant Plus. All Rights Reserved.</div>
      <div class="fs-large fw-600 affiliate-hover" @click="openCompany">About Us</div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: "AffiliateStore",
    data() {
      return {
        searchText: '',
        stores: [],
        length: 5,
      }
    },
    computed: {
      displayStores() {
        return this.stores.slice(0, this.length)
      }
    },
    async created() {
      await this.findStore()
    },
    methods: {
      async findStore() {
        let condition = {}
        if(this.searchText) {
          condition = {
            $or: [{ name: { $regex: this.searchText, $options: 'i'}}, { address: { $regex: this.searchText, $options: 'i'}}, { zipcode: { $regex: this.searchText, $options: 'i'}}]
          }
        }
        const stores = await cms.getModel('Store').find(condition)
        this.stores = _.orderBy(stores, ['affiliateDelivery', 'name'])
        this.length = 5;
      },
      loadMore() {
        this.length += 5
      },
      openCompany() {
        window.open('https://gigasource.io', '_blank')
      }
    }
  }
</script>

<style scoped lang="scss">
  .affiliate {
    display: flex;
    flex-direction: column;
    min-height: 100vh;

    &-header {
      background: url("/plugins/pos-plugin/assets/images/background-store.jpg");
      padding: 24px;
      position: relative;
      background-size: cover;
      height: 481px;

      &:before {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        content: '';
        background: rgba(72, 72, 72, 0.5);
        z-index: 0;
      }

      &__content {
        position: absolute;
        top: 16px;
        left: 0;
        padding-left: 16px;
        right: 0;
        bottom: 0;
        z-index: 2;
      }

      img {
        margin-bottom: 36px;
        z-index: 2;
      }

      &__title {
        color: white;
        text-align: center;
        font-size: 60px;
        font-weight: 700;
        line-height: 72px;
      }

      &__subtitle {
        color: white;
        text-align: center;
        font-size: 36px;
        line-height: 1.2;
        margin-bottom: 90px;
      }

      &__search {
        padding: 8px;
        background-color: white;
        margin: 0 20% 60px;
        width: 60%;
        display: flex;
        align-items: center;
        border-radius: 36px;

        input {
          flex: 1;
          margin: 0 8px;
          font-size: 15px;

          &::placeholder {
            color: #BDBDBD;
          }
        }
      }
    }

    &-content {
      background: #F2F2F2;
      padding: 16px 20%;
      flex: 1;

      &__load {
        text-align: center;
        color: #1271FF;
        cursor: pointer;
      }
    }

    &__footer {
      background: #555555;
      display: flex !important;
      align-items: center;
      justify-content: space-around;
      padding: 4px;
      color: white;
      position: sticky;
      left: 0;
      right: 0;
      bottom: 0;
      cursor: pointer;
    }

    &-hover:hover {
      text-decoration: underline;
    }
  }
</style>
