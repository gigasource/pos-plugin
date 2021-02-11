import { storeLocale } from '../AppSharedStates';

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
      <thead>
      <tr>
        <th>
          <div className="row-flex" style="line-height: 1.75">
            <span className="flex-grow-1 pa-2 ta-left">{t('order.name')}</span>
            <span className="w-10 pa-2 ta-right">{t('order.quantity')}</span>
            <span className="w-12 pa-2 ta-right">{t('order.each')}({t('common.currency', storeLocale.value)})</span>
            <span className="pa-2 ta-right" style="width: 15%; max-width: 15%">{t('common.total')}({t('common.currency', storeLocale.value)})</span>
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
    </g-simple-table>
  )
}
