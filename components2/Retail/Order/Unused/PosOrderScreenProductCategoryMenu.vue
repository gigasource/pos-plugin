<script>
  import { nextTick, onMounted, onActivated, withModifiers } from 'vue';
  import { genScopeId } from '../../../utils';
  import { getAllCategories, changeProductList, activeCategory } from '../temp-logic';

  export default {
    name: 'PosOrderScreenProductCategoryMenu',
    setup() {
      const menu = ref([])
      const menuRef = ref(null)

      onMounted(async () => {
        menu.value = await getAllCategories()
        await nextTick(() => {
          select(menu.value[0])
        })
      })

      onActivated(async () => {
        menu.value = await getAllCategories()
      })

      function select(item) {
        changeCategory.value(item, activeCategory.value)
        changeProductList.value(item, activeCategory.value)
        activeCategory.value = item;
      }

      changeCategory.value = (newValue, oldValue) => {
        if (newValue) {
          const newCategory = newValue.name
          const oldCategory = oldValue && oldValue.name
          if (newCategory && this.$refs[`button_${newCategory}`]) {
            // TODO: refs array
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

      // TODO: area
      return genScopeId(() => (
          <div area="menu" ref={menuRef}>
            {menu.value.map((item, i) =>
                <div key={i} class="btn" onClick={withModifiers(() => select(item), ['stop'])}
                     ref={`button_${item.name}`}>
                  {item.name}
                </div>
            )}
          </div>
      ))
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
