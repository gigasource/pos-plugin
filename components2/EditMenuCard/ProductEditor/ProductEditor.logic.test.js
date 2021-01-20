import { selectedProduct, changeType } from './ProductEditorLogic';
import orderLayoutApi from '../orderLayoutApi';
import { orderLayout, selectedCategoryLayout, selectedProductLayout } from '../../OrderView/pos-ui-shared';
import { createEmptyProduct } from '../utils';

describe('Logic:ProductEditor', () => {
  let _createProduct = orderLayoutApi.createProduct
  let _updateProduct = orderLayoutApi.updateProduct
  let _createProductLayout = orderLayoutApi.createProductLayout
  let _updateProductLayout = orderLayoutApi.updateProductLayout

  beforeEach(() => {
    orderLayoutApi.createProduct = jest.fn(() => {})
    orderLayoutApi.updateProduct = jest.fn(() => {})

    orderLayoutApi.createProductLayout = jest.fn(() => {})
    orderLayoutApi.updateProductLayout = jest.fn(() => {})
  })

  afterEach(() => {
    orderLayoutApi.createProduct = _createProduct
    orderLayoutApi.updateProduct = _updateProduct

    orderLayoutApi.createProductLayout = _createProductLayout
    orderLayoutApi.updateProductLayout = _updateProductLayout
  })

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
    it('should update product isDivArticle property to true when change Article -> Div.Article', async () => {
      selectedProductLayout.value = {
        type: 'Article',
        product: { _id: 0 }
      }

      await changeType('Div.Article')

      expect(selectedProductLayout.product.isDivArticle).toBe(true)
      expect(selectedProductLayout.type).toBe('Div.Article')

      expect(orderLayoutApi.updateProduct.mock.calls.length).toBe(1)
      expect(orderLayoutApi.updateProductLayout.mock.calls.length).toBe(1)
    })
    it('should update product isDivArticle property to false when change Div.Article -> Article', async () => {
      selectedProductLayout.value = {
        type: 'Div.Article',
        product: { _id: 0 }
      }

      await changeType('Article')

      expect(selectedProductLayout.product.isDivArticle).toBe(true)
      expect(selectedProductLayout.type).toBe( 'Article')

      expect(orderLayoutApi.updateProduct.mock.calls.length).toBe(1)
      expect(orderLayoutApi.updateProductLayout.mock.calls.length).toBe(1)
    })
    it('should update product layout type: Article -> Text', async () => {
      selectedProductLayout.value = {
        type: 'Article',
        product: { _id: 0 }
      }

      await changeType('Text')

      expect(selectedProductLayout.product.isDivArticle).toBe(true)
      expect(selectedProductLayout.type).toBe('Text')

      // now we change product to text, but we don't want to clear product info
      // so => no call to product (just keep product as it is)
      // the reason is we allow the user to change back product type to 'article', 'div.article' and product
      expect(orderLayoutApi.updateProduct.mock.calls.length).toBe(0)

      // only call to product layout
      expect(orderLayoutApi.updateProductLayout.mock.calls.length).toBe(1)
    })
  })
})
