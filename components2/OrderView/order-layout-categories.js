import {computed} from "vue";
import {
  editable,
  fillMissingAreas,
  getAreaStyle,
  getGridTemplateFromNumber,
  orderLayout,
  selectedCategoryLayout,
  selectedProductLayout,
  view
} from "./pos-ui-shared";
import {category} from "./order-layout-setting-logic";
import {isSameArea} from "../../components/posOrder/util";


export function orderLayoutCategoriesFactory() {
  const categories = computed(() => {
    if (editable.value) {
      return fillMissingAreas(
        orderLayout.categories,
        orderLayout.columns,
        orderLayout.rows,
        true);
    }
    const a = orderLayout;
    return [...orderLayout.value.categories]
  });

  const categoryContainerStyle = computed(() => {
    if (category && category.type === 'vertical') {
      if (category.differentSize) {
        return {
          display: 'block',
          width: category.size
        }
      }
      return {
        display: 'grid',
        'grid-template-rows': `repeat(8, calc(12.5% - ${5 * 8 / 7}px))`,
        'grid-template-columns': '100%',
        'height': '100%',
        "grid-gap": '5px',
        width: category.size
      }
    }
    if (category && category.type === 'horizontal' && category.singleRow) {
      if (category.differentSize) {
        return {
          display: 'flex',
          maxWidth: '100%',
          overflow: 'auto',
          height: category.size
        }
      }
      return {
        display: 'grid',
        'grid-template-columns': `repeat(8, calc(12.5% - ${5 * 8 / 7}px))`,
        'grid-template-rows': '100%',
        "grid-gap": '5px',
        height: category.size
      }
    }
    return {
      display: 'grid',
      'grid-template-columns': getGridTemplateFromNumber(orderLayout.columns),
      'grid-template-rows': getGridTemplateFromNumber(orderLayout.rows),
      'grid-gap': '5px',
      height: category ? category.size : `${40 * orderLayout.rows}px`
    }
  })

  function getCategoryStyle(category) {
    const isCategorySelected = selectedCategoryLayout && isSameArea(selectedCategoryLayout, category);
    return {
      backgroundColor: category.color,
      color: '#000',
      border: `1px solid ${isCategorySelected ? '#1271FF' : 'transparent'}`,
      boxShadow: isCategorySelected ? '1px 0px 3px rgba(18, 113, 255, 0.36)' : 'none',
      ...category && category.differentSize && (category.type === 'horizontal' ? {marginRight: "5px"} : {marginBottom: "5px"}),
      ...category && category.fontSize && {fontSize: category.fontSize}
    }
  }

  function getCategoryAreaStyle(cateItem) {
    if (category && category.type === 'vertical') {
      return getAreaStyle(cateItem, true)
    } else {
      return getAreaStyle(cateItem)
    }
  }

  async function selectCategory(categoryLayout) {
    if (editable.value) {
      selectedCategoryLayout.value = categoryLayout;
      view.value = {name: 'CategoryEditor'}
    } else {
      selectedCategoryLayout.value = categoryLayout;
    }
    selectedProductLayout.value = null;
  }

  function getCategoryName(item) {
    if (item) return item.name
  }

  const renderCategories = () => (
    <div
      style={{padding: '4px', 'background-color': '#E0E0E0', ...!editable.value && {position: 'sticky', top: 0, 'z-index': 1}}}>
      <div style={categoryContainerStyle}>
        {
          categories.value.map(category => (
            <div class='pol__cate'
                 style={[getCategoryStyle(category), getCategoryAreaStyle(category)]}
                 onClick={() => selectCategory(category)}>
              {getCategoryName(category)}
            </div>
          ))
        }
      </div>
    </div>
  )

  return {
    renderCategories
  }
}
