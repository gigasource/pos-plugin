import { ref } from 'vue'
import { storeLocale } from '../AppSharedStates';
import { execGenScopeId } from '../utils';
import Hooks from 'schemahandler/hooks/hooks'
import {products} from "../Product/product-logic";
import { getCurrentOrder } from "../OrderView/pos-logic-be";
import { addItem } from "../OrderView/pos-logic";

export const retailHook = new Hooks()
export const refundOrder = ref(null)

export const selectedCategory = ref({
  name: 'Favorite'
})

export function selectCategory(item, parent) {
  selectedCategory.value = item
  if (parent) {
    selectedCategory.value.parentId = parent._id
  }
}

export function showSubCategory(category) {
  if (!selectedCategory.value) {
    return false
  }
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
      <g-table striped fixed-header dense>
        {
          execGenScopeId(() => <>
            <thead>
              <tr>
                <th class="flex-grow-1 pa-2 ta-left">{t('order.name')}</th>
                <th class="w-10 pa-2 ta-right">{t('order.quantity')}</th>
                <th class="w-12 pa-2 ta-right">{t('order.each')}({t('common.currency', storeLocale.value)})</th>
                <th class="pa-2 ta-right" style="width: 15%; max-width: 15%">{t('common.total')}({t('common.currency', storeLocale.value)})</th>
              </tr>
            </thead>
            <tbody style="overflow: scroll">
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
            </tbody>
          </>)
        }
      </g-table>
  )
}

export function addProductByBarcode(barcode) {
  const order = getCurrentOrder()
  const item = products.value.find(product => product.barcode === barcode)
  return addItem(order, item, 1)
}
