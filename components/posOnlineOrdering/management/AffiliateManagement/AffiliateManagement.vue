<template>
  <div class="affiliate-management">
    <div class="affiliate-management__title">Affiliate Management</div>
    <div class="affiliate-management__actions-bar">
      <g-text-field-bs prepend-inner-icon="search" placeholder="Restaurant name" v-model="searchText"/>
      <g-menu v-model="showFilterMenu" :close-on-content-click="true" content-class="filter-menu">
        <template v-slot:activator="{on}">
          <g-btn-bs :class="[showFilterMenu && 'btn-sort']" border-color="#e3e5f0" text-color="#757575" icon="sort" @click="on.click">Sort</g-btn-bs>
        </template>
        <div class="filter-options">
          <div :class="['option', { 'option--selected':  orderBy === 'az' }]" @click="orderBy = 'asc'">A to Z</div>
          <div :class="['option', { 'option--selected':  orderBy === 'za' }]" @click="orderBy = 'desc'">Z to A</div>
        </div>
      </g-menu>
    </div>
    <div class="affiliate-management__table">
      <div class="affiliate-management__table-header">
        <div class="col-4 pl-3">Store</div>
        <div class="col-2 pl-1">Current month</div>
        <div class="col-2 pl-1">Last month</div>
        <div class="col-2 pl-1">All time</div>
        <div class="col-2 pl-1">Action</div>
      </div>
      <div class="affiliate-management__table-content">
        <template v-if="!listStores || listStores.length === 0">
          <div class="affiliate-management__table-content--empty">
            <img alt src="/plugins/pos-plugin/assets/empty_group.svg"/>
            <p class="text-grey-darken-1 mt-2">List affiliate stores is currently empty</p>
          </div>
        </template>
        <template v-else>
          <div v-for="(store, i) in listStores" :key="i"
               :class="['affiliate-management__table-row', i % 2 === 0 ? 'affiliate-management__table-row--even' : 'affiliate-management__table-row--odd']">
            <div class="col-4 pl-3">{{store.name}}</div>
            <div class="col-2 pl-1">{{store.affiliateDelivery.currentMonthCounter || 0}}</div>
            <div class="col-2 pl-1">{{store.affiliateDelivery.lastMonthCounter || 0}}</div>
            <div class="col-2 pl-1">{{getAllTimeCounter(store)}}</div>
            <div class="col-2 pl-1 row-flex">
              <div class="action-item">
                <g-tooltip open-on-hover bottom speech-bubble color="#000" transition="0.3" remove-content-on-close>
                  <template v-slot:activator="{on}">
                    <div class="action-item__btn fork_knife"
                         @mouseenter="on.mouseenter"
                         @mouseleave="on.mouseleave"
                         @click.stop.prevent="openWebShopSetting(store)">
                      <g-icon size="20">icon-fork_knife_setting</g-icon>
                    </div>
                  </template>
                  <span>Online Ordering Config</span>
                </g-tooltip>
              </div>
              <div class="action-item">
                <g-tooltip open-on-hover bottom speech-bubble color="#000" transition="0.3" remove-content-on-close>
                  <template v-slot:activator="{on}">
                    <div class="action-item__btn link"
                         @mouseenter="on.mouseenter"
                         @mouseleave="on.mouseleave"
                         @click.stop.prevent="openAffiliateUrl(store)">
                      <g-icon size="20">icon-link</g-icon>
                    </div>
                  </template>
                  <span>Open link</span>
                </g-tooltip>
              </div>
              <div class="action-item">
                <g-tooltip open-on-hover bottom speech-bubble color="#000" transition="0.3" remove-content-on-close>
                  <template v-slot:activator="{on}">
                    <div class="action-item__btn reset"
                         @mouseenter="on.mouseenter"
                         @mouseleave="on.mouseleave"
                         @click.stop.prevent="openDialogConfirm(store)">
                      <g-icon size="18">icon-reset2</g-icon>
                    </div>
                  </template>
                  <span>Reset all</span>
                </g-tooltip>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
    <g-dialog v-model="dialog" width="350" eager>
      <g-card class="pa-3">
        <g-card-title style="font-size: 24px">Confirm reset</g-card-title>
        <g-card-text class="ta-center">Do you want to reset all the statistic of <b>{{selectedStore && selectedStore.name}}</b></g-card-text>
        <g-card-actions class="row-flex align-items-center">
          <g-spacer/>
          <g-btn-bs width="90" text-color="#424242" @click="dialog = false">Cancel</g-btn-bs>
          <g-btn-bs width="90" background-color="#FF5252" text-color="white" @click="resetCounter">Reset</g-btn-bs>
        </g-card-actions>
      </g-card>
    </g-dialog>
  </div>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: "AffiliateManagement",
    props: {},
    data() {
      return {
        searchText: '',
        showFilterMenu: false,
        orderBy: 'asc',
        stores: [],
        selectedStore: null,
        dialog: false
      }
    },
    async created() {
      await this.loadStores()
    },
    computed: {
      listStores() {
        const stores = this.stores.filter(store => store.name.includes(this.searchText))
        return _.orderBy(stores, ['name'], [this.orderBy])
      }
    },
    methods: {
      async loadStores() {
        const stores = await cms.getModel('Store').find({
          'affiliateDelivery.active': true
        })
        this.stores = stores.map(s => ({
          ...s,
          name: s.name ? s.name : s.settingName
        }))
      },
      getAllTimeCounter(store) {
        const { lastMonthCounter, currentMonthCounter, oldTimeCounter } = store.affiliateDelivery
        return (lastMonthCounter || 0) + (currentMonthCounter || 0) + (oldTimeCounter || 0)
      },
      openWebShopSetting(store) {
        window.open(`${location.origin}/setting/${store.alias || store._id}`)
      },
      openAffiliateUrl(store) {
        window.open(store.affiliateDelivery.url)
      },
      openDialogConfirm(store) {
        this.selectedStore = store
        this.dialog = true
      },
      async resetCounter() {
        const affiliateDelivery = {
          ...this.selectedStore.affiliateDelivery,
          currentMonthCounter: 0,
          lastMonthCounter: 0,
          oldTimeCounter: 0
        }
        await cms.getModel('Store').findOneAndUpdate({ _id: this.selectedStore._id }, { affiliateDelivery })
        await this.loadStores()
        this.dialog = false
      }
    }
  }
</script>

<style scoped lang="scss">
  .affiliate-management {
    height: 100%;

    .btn-sort {
      background: #FFFFFF;
      border: 1px solid #536DFE !important;
      border-radius: 2px;
      color: #536DFE !important;
    }

    &__title {
      font-size: 20px;
      line-height: 25px;
      font-weight: 700;
      color: #000000;
      margin-bottom: 24px;
    }

    &__breadcrumbs {
      font-size: 20px;
      line-height: 25px;
      font-weight: 700;
      color: #000000;
      margin-bottom: 24px;

      span:first-child {
        color: #9e9e9e;
        cursor: pointer;
      }
    }

    &__actions-bar {
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      margin-right: -8px;

      .bs-tf-wrapper {
        width: auto;
        margin: 0;

        ::v-deep .bs-tf-input-group {
          background: white;
        }
      }
    }

    &__table {
      height: calc(100% - 120px);
      overflow: hidden;
      background: #FFFFFF;
      box-shadow: 2px 0px 5px rgba(0, 0, 0, 0.1398);
      border-radius: 2px;

      &-header {
        background: #EFEFEF;
        height: 38px;
        display: flex;
        align-items: center;
        font-size: 12px;
        font-weight: 700;
        color: #757575;
      }

      &-content {
        height: calc(100% - 38px);
        overflow: hidden scroll;

        &--empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-items: center;
          margin-top: 64px;
        }
      }


      &-row {
        display: flex;
        align-items: center;
        height: 55px;
        font-size: 14px;
        color: #424242;

        &--odd {
          background: #FAFAFC;
        }

        &--even {
          background: #FFFFFF;
        }

        .action-item {
          margin: 0 8px 0 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;

          &__btn {
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;

            &.link:hover > .icon-link {
              background-image: url("/plugins/pos-plugin/assets/link_blue.svg");
            }

            &.reset:hover > .icon-reset2 {
              background-image: url("/plugins/pos-plugin/assets/reset2_blue.svg");
            }

            &.fork_knife:hover > .icon-fork_knife_setting {
              background-image: url("/plugins/pos-plugin/assets/fork_knife_setting_blue.svg");
            }
          }

          &:hover .action-item__btn {
            background: #eeeeee;
          }
        }
      }
    }
  }

  .filter-options {
    background: #FFFFFF;
    border: 1px solid #D3D3D3;
    border-radius: 2px;

    .option {
      background-color: #FFF;
      font-size: 14px;
      line-height: 20px;
      padding: 12px 16px;
      text-align: left;
      user-select: none;
      cursor: pointer;
      color: #201F2B;

      &--selected {
        background-color: #EFEFEF;
      }

      &:hover {
        background-color: #EFEFEF;
      }
    }
  }
</style>
