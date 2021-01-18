import { selectedProduct, changeType } from './ProductEditorLogic';
import { orderLayout, selectedCategoryLayout, selectedProductLayout } from '../../OrderView/pos-ui-shared';
import { createEmptyProduct } from '../utils';

describe('Logic:ProductEditor', () => {
  describe('selectedProduct', () => {
    it('should null if product layout is not selected', () => {
      selectedProductLayout.value = null
      expect(selectedProduct).toBe(null)
    })
    it('should create empty product if selected product layout is focus on empty area', () => {
      selectedProductLayout.value = { /*layout props*/ }
      expect(selectedProduct).toEqual(createEmptyProduct())
    })
    it('should return product if selectedProductLayout focus on product area', () => {
      const product = { name: 'Moon-cake', price: 100 }
      selectedProductLayout.value = { product }
      expect(selectedProduct).toEqual(product)
    })
  })

  describe('change product type', () => {
    it('should update product isDivArticle property', async () => {
      selectedProductLayout.value = {
        type: 'Article',
        product: {}
      }

      await changeType('Div.Article')

      expect(selectedProductLayout.product.isDivArticle).toBe(true)
      expect(selectedProductLayout.type).toBe('Div.Article')
    })
  })
})
