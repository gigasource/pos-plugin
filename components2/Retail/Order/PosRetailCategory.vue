<script>
import { categories, selectedCategory, selectCategory, showSubCategory } from '../pos-order-retail-logic'
import { genScopeId } from '../../utils';

export default {
  name: "PosRetailCategory",
  setup() {
    function getSubCategoryClass(item) {
      return [
          'category-group__item',
          selectedCategory.value && selectedCategory.value._id === item._id && 'category-group__item--selected'
      ]
    }
    function renderSubCategory(category) {
      // Known issue: even showCategory return false, g-expand doesn't collapse
      // Work-around: move showSubCategory to outside g-expand-transition
      // Side effect: no transition will be apply
      return showSubCategory(category) && (
          <g-expand-transition>
            { genScopeId(() => (
                  <div>
                    { category.subCategory.map((item, i) =>
                        <div key={i} class={getSubCategoryClass(item)}
                             onClick={() => selectCategory(item, category)}>
                          <g-icon size="12" class="mr-2">radio_button_unchecked</g-icon>
                          <div>{item.name}</div>
                        </div>
                    )}
                  </div>
              ))()
            }
          </g-expand-transition>
      )
    }
    function getCategoryClass(category) {
      return [
        'm-elevation-1',
        'category-group__header',
        selectedCategory.value && selectedCategory.value._id === category._id && 'category-group__header--selected'
      ]
    }
    return genScopeId(() => (
        <div class="category">
          {
            categories.value.map((category, iGroup) =>
              <div key={`cate_${iGroup}`} class="category-group">
                <div class={getCategoryClass(category)}
                     onClick={() => selectCategory(category)}>
                  { category.name }
                  { category.icon && <g-icon class="ml-1" size="14" color={category.iconColor}>{category.icon}</g-icon> }
                </div>
                { renderSubCategory(category) }
              </div>
          )}
        </div>
    ))
  }
}
</script>

<style scoped lang="scss">
.category {
  background-color: #E3F2FD;
  padding: 4px;

  &-group {
    background-color: white;
    border-radius: 2px;
    margin-bottom: 4px;

    &__header {
      display: flex;
      align-items: center;
      font-size: 14px;
      font-weight: 700;
      line-height: 18px;
      padding: 12px 16px;
      border-radius: 2px 2px 0 0;

      &--selected {
        background-color: #1271FF;
        color: white;
      }
    }

    &__item {
      display: flex;
      align-items: center;
      font-size: 14px;
      line-height: 18px;
      padding: 12px 16px;

      &--selected {
        background-color: #1271FF;
        color: white;

        .g-icon {
          color: white;
        }
      }
    }
  }
}
</style>
