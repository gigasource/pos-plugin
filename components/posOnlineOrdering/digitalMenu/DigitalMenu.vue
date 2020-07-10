<template>
  <div class="digital-menu">
    <div class="digital-menu__logo">
      <img alt :src="cdnStoreLogoImage"/>
    </div>
    <div class="digital-menu__tab">
      <div id="tab" class="digital-menu__tab--category">
        <g-chip v-for="(category, i) in categories" :key="`category_${i}`" :id="`tab_${category._id}`" @click="chooseCategory(category._id)"
                class="digital-menu__category" :background-color="category._id === selectedCategoryId ? '#BBDEFB' : '#ECF0F5'">
          {{category.name}}
        </g-chip>
      </div>
      <div class="digital-menu__tab--content" @touchstart="touch">
        <div v-for="(category, i) in listItem" :id="`category_content_${category._id}`" :key="`category_${i}`" :class="[i > 0 && 'mt-5']">
          <div class="digital-menu__title">
            {{ category && category.name }}
            ({{category && category.items.length}})
          </div>
          <digital-menu-item
                v-for="(item, index) in category.items" :key="index"
                v-bind="item"
                class="mt-2"
                :display-id="store.displayId"
                :scrolling="scrolling"
                :display-image="store.displayImage"
                :store-country-locale="storeCountryLocale"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { getCdnUrl } from '../../Store/utils';
  import { smoothScrolling } from 'pos-vue-framework';

  export default {
    name: "DigitalMenu",
    data() {
      return {
        store: Object,
        categories: Array,
        selectedCategoryId: null,
        products: Array,
        throttle: null,
        choosing: 0,
        scrolling: 0,
      }
    },
    async created() {
      const storeIdOrAlias = this.$route.params.storeIdOrAlias
      if (storeIdOrAlias) {
        this.store = await cms.getModel('Store').findOne({alias: storeIdOrAlias})
        await this.loadCategories()
        await this.loadProducts()
      }
    },
    mounted() {
      //scroll
      this.throttle = _.throttle(this.handleScroll, 100)
      this.$nextTick(() => {
        document.addEventListener('scroll', this.throttle)
        smoothScrolling && smoothScrolling()
      })
    },
    computed: {
      listItem() {
        const categories = _.cloneDeep(this.categories)
        const products = _.cloneDeep(this.products)
        _.each(categories, cate => {
          cate.items = _.orderBy(_.filter(products, p => p.category._id === cate._id), 'position', 'asc')
        })
        return categories
      },
      cdnStoreLogoImage() {
        return this.store.logoImageSrc && getCdnUrl(this.store.logoImageSrc || '/plugins/pos-plugin/assets/images/logo.png')
      },
      storeCountryLocale() {
        return (this.store && this.store.country && this.store.country.locale) || 'en'
      },
    },
    methods: {
      async loadCategories() {
        const categories = await cms.getModel('Category').find({ store: this.store._id }, { store: 0 })
        this.$set(this, 'categories', _.orderBy(categories, 'position', 'asc'))
      },
      async loadProducts() {
        this.$set(this, 'products', await cms.getModel('Product').find({ store: this.store._id }, { store: 0 }))
      },
      chooseCategory(id) {
        this.choosing++
        const wrapper = document.documentElement
        const content = document.getElementById(`category_content_${id}`)
        if(wrapper && content) {
          wrapper.scroll({top: content.offsetTop - 64, left: 0, behavior: "smooth"})
          this.selectedCategoryId = id
          setTimeout(() => {
            this.choosing--
          }, 1000)
        }
      },
      handleScroll() {
        if(this.choosing > 0) return
        const categoryInViewPort = _.filter(this.categories, ({_id: id}) => {
          const el = document.getElementById(`category_content_${id}`);
          const {top, bottom} = el.getBoundingClientRect()
          return top >= 64 || bottom >= (window.innerHeight - 100);
        })
        this.selectedCategoryId = categoryInViewPort[0]._id
        const wrapper = document.documentElement
        if(!this.selectedCategoryId || (window.innerHeight + wrapper.scrollTop >= wrapper.scrollHeight)) {
          this.selectedCategoryId = _.last(this.categories)._id
        }

        document.querySelectorAll('.g-menu--content').forEach(menu => { menu.style.display = 'none' })
      },
      touch() {
        this.scrolling++
      }
    },
    watch: {
      selectedCategoryId(val) {
        const tab = document.getElementById(`tab_${val}`)
        const wrapper = document.getElementById('tab')
        if(tab) {
          const siblingWidth = tab.previousSibling ? tab.previousSibling.offsetWidth : 32
          wrapper.scroll({top: 0, left: (tab.offsetLeft - siblingWidth/2 - wrapper.offsetLeft), behavior: "smooth"})
        }
      },
    }
  }
</script>

<style scoped lang="scss">
  .digital-menu {
    &__logo {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 12px 24px 0;

      & > img {
        max-width: 50%;
      }
    }

    &__tab {
      &--category {
        overflow: auto hidden;
        position: sticky;
        top: 0;
        background-color: white;
        padding: 8px 0;
        display: flex;
        flex-wrap: nowrap;
        z-index: 10;
        scrollbar-width: none; // firefox
        -ms-overflow-style: none; //edge

        &::-webkit-scrollbar {
          display: none;
        }

        .g-chip:first-child {
          margin-left: 16px;
        }
      }

      &--content {
        padding: 0 16px 16px;
      }
    }

    &__title {
      font-size: 14px;
      font-weight: 600;
      color: #424242;
      text-transform: uppercase;
    }
  }
</style>
