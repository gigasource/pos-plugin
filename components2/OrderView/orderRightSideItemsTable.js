import {$filters} from "../AppSharedStates";
import {useI18n} from "vue-i18n";
import {nextTick, reactive, ref, watchEffect, withModifiers} from "vue";
import {getCurrentOrder, itemQuantityChangeCheck} from "./pos-logic-be";
import {
  addItem,
  addModifier,
  changeCourse,
  changeItemQuantity,
  removeItem,
  removeModifier,
  updateItem
} from "./pos-logic";
import {getItemSubtext, isItemDiscounted} from "./pos-ui-shared";

export function orderRightSideItemsTable() {
  let {t: $t, locale} = useI18n();
  const order = getCurrentOrder();

  const dialogConfigOrderItem = reactive({
    value: false,
    product: null,
    originalPrice: 0,
    price: 0,
  })

  function openConfigDialog(item) {
    if (item.printed) return
    Object.assign(dialogConfigOrderItem, {
      product: item,
      value: true,
      originalPrice: item.originalPrice,
      price: 0
    })
  }

  const getTouchHandlers = item => ({
    left: () => changeCourse(order, item, -1),
    right: () => changeCourse(order, item, 1)
  });

  function changePrice(price) {
    updateItem(order, dialogConfigOrderItem.product, {price});
  }

  function _addItem(order, item) {
    if (item.sent) return;
    changeItemQuantity(order, item, 1)
  }

  function showItem(item) {
    if (item.quantity > 0) return true;
    return itemQuantityChangeCheck(item.quantityModified)
  }

  const tableRef = ref();
  watchEffect(() => {
    nextTick(() => tableRef.value.scroll && tableRef.value.scroll({top: tableRef.value.scrollHeight, behavior: 'smooth'}))
  })

  const renderItemsTable = () => {
    return (
      <>
        <div class="order-detail__content" ref={tableRef}>
          {order.items.map(item => (
            showItem(item) &&
            <div class="item"
                 style={[item.separate && {borderBottom: '2px solid red'}]}
                 onClick={withModifiers(() => openConfigDialog(item), ['stop'])} v-touch={getTouchHandlers(item)}>
              <div class="item-detail">
                <div style={[item.sent && {opacity: 0.55}]}>
                  <p class="item-detail__name">{item.id && `${item.id}. `}{item.name}</p>
                  <p>
                  <span class={['item-detail__price', isItemDiscounted(item) && 'item-detail__discount']}>
                    {$t('common.currency', locale)}{$filters.formatCurrency(isItemDiscounted(item) ? item.originalPrice : item.price)}
                  </span>
                    {isItemDiscounted(item) &&
                    <span class="item-detail__price--new">
                      {$t('common.currency', locale)}{$filters.formatCurrency(item.price)}
                    </span>}
                    <span
                      class={['item-detail__option', item.takeAway ? 'text-green-accent-3' : 'text-red-accent-2']}>
                    {getItemSubtext(item)}
                  </span>
                  </p>
                </div>
                <div class="item-action">
                  <g-icon onClick={withModifiers(() => removeItem(order, item), ['stop'])}
                          color={item.sent ? '#FF4452' : '#000'}>remove_circle_outline
                  </g-icon>
                  <span class="ml-1 mr-1">{item.quantity}</span>
                  <g-icon onClick={withModifiers(() => _addItem(order, item), ['stop'])}
                          style={[item.sent && {opacity: 0.5}]}>add_circle_outline
                  </g-icon>
                </div>
              </div>
              {item.modifiers &&
              <div>
                {item.modifiers.map(modifier => (
                  <g-chip label small text-color="#616161" close onClose={() => removeModifier(order, item, modifier)}>
                    {modifier.name} | {$t('common.currency', locale)}
                    {$filters.formatCurrency(modifier.price)}
                  </g-chip>
                ))}
              </div>
              }
            </div>
          ))}
        </div>

        <dialog-config-order-item v-model={dialogConfigOrderItem.value}
                                  original-value={dialogConfigOrderItem.originalPrice}
                                  product={dialogConfigOrderItem.product}
                                  onAddModifier={addModifier} onChangePrice={changePrice}/>
      </>
    )
  }
  return {renderItemsTable}
}
