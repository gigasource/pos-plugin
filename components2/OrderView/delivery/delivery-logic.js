import { computed, ref } from 'vue';
import cms from 'cms';
import { favorites } from './delivery-shared';

export const currentOrder = ref({
  items: [],
  hasOrderWideDiscount: false,
  firstInit: false
})
export const itemsWithQty = computed(() => {
  if (currentOrder.value && currentOrder.value.items)
    return currentOrder.value.items.filter(i => i.quantity > 0)
  return []
});

// inc 1
export function addItem(item) {
  //fixme: refactore
}

// dec 1
export function removeItem(item) {
  //fixme: refactore
}

// remove modifier from specified item in order
export function removeModifier(item, index) {
  //fixme: refactore
}

// online-order products
export const products = ref([])
export async function loadProduct() {
  products.value = (await cms.getModel('Product').find({type: 'delivery'})).map(p => ({ ...p, text: `${p.id}. ${p.name}` }))
  favorites.value = products.value.filter(p => p.option.favorite)
}

export const keyboardConfig = ref([])
export async function loadKeyboard() {
  const setting = await cms.getModel('PosSetting').findOne()
  keyboardConfig.value = setting && setting['keyboardDeliveryConfig']
}
