<template>
  <div area="menu">
    <g-btn :class="[item === activeCategory ? 'menu__active' : '']" :key="i" :uppercase="false" @click.stop="select(item)" background-color="#fff" elevation="0" height="100%"
           text-color="#1d1d26" v-for="(item, i) in menu">
      {{item.name}}
    </g-btn>
  </div>
</template>

<script>
  export default {
    name: 'PosArticleProductCategoryMenu',
    injectService: [`SettingsStore:(activeCategory, getActiveProducts, getAllCategories, articleSelectedProductButton, articleSelectedColor, updateArticleOrders)`],
    data() {
      return {
        menu: [],
      }
    },
    methods: {
      async select(item) {
        this.activeCategory = item;
        this.articleSelectedProductButton = null;
        this.articleSelectedColor = null;
        await this.getActiveProducts()
        this.updateArticleOrders();
      },
    },
    async activated() {
      setTimeout(async() => {
        this.menu = await this.getAllCategories();
        await this.select(this.menu[0])
      }, 100)
    }
  }
</script>

<style lang="scss" scoped>
  .menu {
    background-color: #90CAF9;
    overflow-x: auto;
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-auto-columns: 32%;
    grid-gap: 6px;
    grid-auto-flow: column;
    padding: 6px;

    &::-webkit-scrollbar {
      display: none;
    }

    &__active {
      background-color: #2979FF !important;
      color: white !important;
    }

    &:after {
      content: '';
      width: 1px;
      height: 100%;
    }
  }
</style>
