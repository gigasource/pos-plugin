import { changeType, layoutType, setAction } from './ProductEditorLogic';
import orderLayoutApi from '../orderLayoutApi';
import {
  orderLayout,
  selectedCategoryLayout,
  selectedProductLayout,
  selectedProduct,
  updateSelectedCategoryLayout, updateSelectedProductLayout, loadOrderLayout, editable, selectProductLayout
} from '../../OrderView/pos-ui-shared';
import { createEmptyProduct } from '../utils';
import { nextTick } from 'vue';

import { orm } from '../../test-utils'
import { demoData } from '../../OrderView/__test__/demoData';

describe('Logic:ProductEditor', () => {
  beforeEach(async () => {
    await orm("OrderLayout").remove({});
    await orm("OrderLayout").create(demoData.OrderLayout[0]);
  });

  describe('selectedProduct', () => {
    beforeEach(async () => {
      editable.value = true
      await loadOrderLayout();
    })

    it('should null if product layout is not selected', () => {
      selectProductLayout({top: 0, left: 0})
      selectedProductLayout.value = null
      expect(selectedProduct.value).toBe(null)
    })
    it('should create empty product if selected product layout is focus on empty area', () => {
      selectedProductLayout.value = { /*layout props*/ }
      expect(selectedProduct.value).toEqual(createEmptyProduct())
    })
    it('should return product if selectedProductLayout focus on product area', () => {
      const product = { name: 'Moon-cake', price: 100 }
      selectedProductLayout.value = { product }
      expect(selectedProduct.value).toEqual(product)
    })
  })
})
