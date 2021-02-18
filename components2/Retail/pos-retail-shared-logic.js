import { ref } from 'vue'
import { storeLocale } from '../AppSharedStates';
import { execGenScopeId } from '../utils';

export const selectedCategory = ref({
  name: 'Favorite'
})
export function selectCategory(item, parent) {
  selectedCategory.value = item
  if (parent)
    selectedCategory.value.parentId = parent._id
}

export function showSubCategory(category) {
  if (!selectedCategory.value)
    return false
  return (category.subCategory && category.subCategory.length > 0 &&
    (selectedCategory.value._id === category._id || selectedCategory.value.parentId === category._id))
}

export function getProductLayout(item, category) {
  const isFavourite = category && category.name === 'Favourite' || false
  return item.layouts && item.layouts.find(layout => !!layout.favourite === isFavourite) || {}
}

export function getProductGridOrder(product, isFavourite = false) {
  const layout = product.layouts && product.layouts.find(layout => isFavourite ? layout.favourite : !layout.favourite);
  return layout ? layout.order : 0
}

export function renderDisplayOrderItemsTable(order, t) {
  return (
      <g-simple-table striped fixed-header>
        {
          execGenScopeId(() => <>
            <thead>
            <tr>
              <th>
                <div class="row-flex" style="line-height: 1.75">
                  <span class="flex-grow-1 pa-2 ta-left">{t('order.name')}</span>
                  <span class="w-10 pa-2 ta-right">{t('order.quantity')}</span>
                  <span class="w-12 pa-2 ta-right">{t('order.each')}({t('common.currency', storeLocale.value)})</span>
                  <span class="pa-2 ta-right" style="width: 15%; max-width: 15%">{t('common.total')}({t('common.currency', storeLocale.value)})</span>
                </div>
              </th>
            </tr>
            </thead>
            {
              order.items.map((item, index) =>
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.price}</td>
                    <td>{item.quantity * item.price}</td>
                  </tr>
              )
            }
          </>)
        }
      </g-simple-table>
  )
}

export function chooseFunction(functionName) {
  //todo: add more function
  if (!functionName) return
  return () => {
  }
}
