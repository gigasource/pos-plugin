import {computed} from "vue";
import {
  editable,
  fillMissingAreas,
  getAreaStyle,
  getGridTemplateFromNumber,
  orderLayout,
  selectedCategoryLayout,
  updateSelectedCategoryLayout,
  updateSelectedProductLayout,
  updateView
} from './pos-ui-shared';
import {category} from "./order-layout-setting-logic";
import {isSameArea} from "../../components/posOrder/util";


export function orderLayoutCategoriesFactory() {
  const categories = computed(() => {
    console.log('editable : ', editable.value)
    if (editable.value) {
      return fillMissingAreas(
        orderLayout.value.categories,
        orderLayout.value.columns,
        orderLayout.value.rows,
        true);
    }
    console.log(orderLayout.value.categories);
    return [...orderLayout.value.categories]
  });

  const categoryContainerStyle = computed(() => {
    if (category.type === 'vertical') {
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
      'grid-template-columns': getGridTemplateFromNumber(orderLayout.value.columns),
      'grid-template-rows': getGridTemplateFromNumber(orderLayout.value.rows),
      'grid-gap': '5px',
      height: category ? category.size : `${40 * orderLayout.value.rows}px`
    }
  })

  function getCategoryStyle(_category) {
    const isCategorySelected = selectedCategoryLayout.value && isSameArea(selectedCategoryLayout.value, _category);
    return {
      backgroundColor: _category.color,
      color: '#000',
      border: `1px solid ${isCategorySelected ? '#1271FF' : 'transparent'}`,
      boxShadow: isCategorySelected ? '1px 0px 3px rgba(18, 113, 255, 0.36)' : 'none',
      ...category.differentSize && (category.type === 'horizontal' ? {marginRight: "5px"} : {marginBottom: "5px"}),
      ...category.fontSize && {fontSize: category.fontSize}
    }
  }

  function getCategoryAreaStyle(_category) {
    if (category.type === 'vertical') {
      return getAreaStyle(_category, true)
    } else {
      return getAreaStyle(_category)
    }
  }

  async function selectCategory(categoryLayout) {
    if (editable.value) {
      updateSelectedCategoryLayout(categoryLayout)
      updateView('CategoryEditor')
    } else {
      updateSelectedCategoryLayout(categoryLayout)
    }
    updateSelectedProductLayout(null)
  }

  function getCategoryName(item) {
    if (item) return item.name
  }

  const renderCategories = () => (
    <div
      style={{padding: '4px', 'background-color': 'rgb(224, 224, 224, 0.7)', ...!editable.value && {position: 'sticky', top: 0, 'z-index': 1}}}>
      <div style={categoryContainerStyle.value}>
        {categories.value.map((_category, index) => (
          <div class='pol__cate'
               key={index}
               style={[getCategoryStyle(_category), getCategoryAreaStyle(_category)]}
               onClick={() => selectCategory(_category)}>
            {getCategoryName(_category)}
          </div>
        ))}
      </div>
    </div>
  )

  return {
    renderCategories
  }
}
