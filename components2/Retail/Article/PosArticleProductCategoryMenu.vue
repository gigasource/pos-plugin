<script>
  import { onActivated, withModifiers } from 'vue'
  import { genScopeId } from '../../utils';
  import {
    activeCategory, articleSelectedProductButton, articleSelectedColor,
    getActiveProducts, updateArticleOrders
  } from '../pos-article-logic'
  import {
    categories
  } from '../../Product/product-logic';
  import {
    loadCategories
  } from '../../Product/product-logic-be';

  export default {
    name: 'PosArticleProductCategoryMenu',
    setup() {
      onActivated(async() => {
        await loadCategories();
        await select(categories.value[0])
      })

      async function select(item) {
        activeCategory.value = item;
        articleSelectedProductButton.value = null;
        articleSelectedColor.value = null;
        await getActiveProducts()
        await updateArticleOrders();
      }

      return genScopeId(() => (
          <div class="menu">
            {
              categories.value.map((item, i) =>
                <g-btn class={[item === activeCategory.value ? 'menu__active' : '']}
                       key={i} uppercase={false}
                       onClick={withModifiers(() => select(item), ['stop'])}
                       backgroundColor={'#fff'} elevation={0} height="100%"
                       text-color={'#1d1d26'}>
                  {item.name}
                </g-btn>
              )
            }
      </div>
      ))
    },
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
