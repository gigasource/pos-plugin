<template>
  <div class="main">
    <g-scroll-window :show-arrows="false" area="window" elevation="0" v-model="activeWindow">
      <g-scroll-window-item :key="windowIndex" @input="updateActiveWindow(windowIndex)" v-for="(window, windowIndex) in productWindows">
        <g-btn :active="articleSelectedProductButton && (articleSelectedProductButton._id === item._id)"
               :active-class="productActive"
               :key="i"
               :style="getBtnStyle(item)"
               :uppercase="false"
               @click="selectArticle(item)"
               flat
               height="100%"
               v-for="(item, i) in window"
        >
          {{item.name}}
        </g-btn>
      </g-scroll-window-item>
    </g-scroll-window>
    <g-item-group :items="productWindows" :return-object="false" area="delimiter" mandatory v-model="activeWindow">
      <template v-slot:default="{ toggle, active }">
        <template v-for="(item, index) in productWindows" :key="index">
          <g-item :is-active="active(item)" :item="item">
            <g-btn :uppercase="false" @click="toggle(item)" border-radius="50%"></g-btn>
          </g-item>
        </template>
      </template>
    </g-item-group>
  </div>
</template>

<script>
  import _ from 'lodash'
  import {getProductGridOrder} from '../logic/productUtils'

  export default {
    name: 'PosArticleScrollWindow',
    props: {
      value: {
        type: Number,
        default: 0
      }
    },
    injectService: ['SettingsStore:(activeCategory, activeCategoryProducts, selectArticle, articleSelectedProductButton)'],
    data() {
      return {
        activeProductWindow: 0,
        productActive: 'product-active',
      }
    },
    methods: {
      updateActiveWindow(value) {
        this.activeWindow = value
      },
      getBtnStyle(item) {
        const layout = item.layouts && item.layouts.find(layout => this.isFavouriteCategory
          ? layout.favourite
          : !layout.favourite)

        return layout
          ? {
            order: getProductGridOrder(item, this.isFavouriteCategory),
            backgroundColor: layout.color,
            border: !layout.color || layout.color === '#FFFFFF' || layout.color === 'white' ? '1px solid rgb(151, 151, 151)' : ''
          }
          : null
      }
    },
    computed: {
      productWindows() {
        return _.chunk(this.activeCategoryProducts, 28)
      },
      isFavouriteCategory() {
        return this.activeCategory && this.activeCategory.name === 'Favourite'
      },
      activeWindow: {
        get() {
          if (this.articleSelectedProductButton) {
            return this.productWindows.findIndex(v => {
              return v.some((item) =>
                getProductGridOrder(item, this.isFavouriteCategory) === getProductGridOrder(this.articleSelectedProductButton, this.isFavouriteCategory))
            })
          }
          return this.activeProductWindow
        },
        set(val) {
          this.activeProductWindow = val
        }
      }
    },
    async activated() {
      this.articleSelectedProductButton = null;
      this.activeCategory && await this.$getService('SettingsStore:getActiveProducts')()
    }
  }
</script>

<style lang="scss" scoped>
  .product-active {
    border: 2px solid #1271FF;
  }

  .main {
    padding: 6px 6px 6px 6px;
    overflow: hidden;

    .g-window {
      width: 100%;

      ::v-deep .g-window__container {
        height: 100%;
      }

      .g-window-item,
      .g-scroll-window-item {
        height: 100%;
        display: grid;
        grid-template-rows: repeat(7, 1fr);
        grid-template-columns: repeat(4, 1fr);
        grid-gap: 6px;
        margin-right: 6px;

        ::v-deep .g-btn {
          white-space: normal;
          padding: 0 !important;

          .g-btn__content {
            flex: 0 1 auto;
            line-height: 0.9;
          }
        }
      }
    }

    .g-item-group {
      align-items: center;
      justify-content: center;

      .g-btn {
        width: 8px !important;
        height: 8px !important;
        border-radius: 50%;
        min-width: 0 !important;
        padding: 0 !important;
        margin: 0 6px;
        box-shadow: none;
        background-color: #E0E0E0 !important;
      }

      .g-item__active .g-btn {
        background-color: #2196F3 !important;
      }
    }
  }
</style>
