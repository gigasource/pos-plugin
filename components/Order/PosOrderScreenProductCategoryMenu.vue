<template>
  <div area="menu" ref="menu">
    <div v-for="(item, i) in menu" :key="i"
         class="btn"
         @click.stop="select(item)"
         :ref="`button_${item.name}`">
      {{item.name}}
    </div>
  </div>
</template>

<script>
  import { nextTick } from 'vue';

  export default {
    name: 'PosOrderScreenProductCategoryMenu',
    data() {
      return {
        menu: [],
      }
    },
    methods: {
      select(item) {
        this.posStore.changeCategory(item, this.posStore.activeCategory)
        this.posStore.changeProductList(item, this.posStore.activeCategory)
        this.posStore.activeCategory = item;
      },
    },
    async created() {
      this.posStore = this.$getService('OrderStore');

      this.posStore.changeCategory = (newValue, oldValue) => {
        if (newValue) {
          const newCategory = newValue.name
          const oldCategory = oldValue && oldValue.name
          if (newCategory && this.$refs[`button_${newCategory}`]) {
            this.$refs[`button_${newCategory}`][0].classList.add('menu__active')
          }

          if (oldCategory) {
            if (newCategory === oldCategory) return
            const oldRef = this.$refs[`button_${oldCategory}`];
            if (oldRef && oldRef.length > 0) {
              oldRef[0].classList.remove('menu__active')
            }
          }
        }
      }
    },
    async mounted() {
      this.menu = await this.$getService('SettingsStore:getAllCategories')()
      nextTick(() => {
        this.select(this.menu[0])
      })
    },
    async activated() {
      this.menu = await this.$getService('SettingsStore:getAllCategories')()
    }
  }
</script>

<style scoped lang="scss">
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

    .btn {
      background-color: #fff;
      color: #1d1d26;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      cursor: pointer;
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

<style lang="scss">
  .order {
    .layout__right {
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.25);
    }
  }
</style>
