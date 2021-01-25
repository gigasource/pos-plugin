import { changeType, layoutType, setAction } from './ProductEditorLogic';
import orderLayoutApi from '../orderLayoutApi';
import {
  orderLayout,
  selectedCategoryLayout,
  selectedProductLayout,
  selectedProduct,
  updateSelectedCategoryLayout, updateSelectedProductLayout
} from '../../OrderView/pos-ui-shared';
import { createEmptyProduct } from '../utils';
import { nextTick } from 'vue';

describe('Logic:ProductEditor', () => {
  let _createProduct = orderLayoutApi.createProduct
  let _updateProduct = orderLayoutApi.updateProduct
  let _createProductLayout = orderLayoutApi.createProductLayout
  let _updateProductLayout = orderLayoutApi.updateProductLayout

  // beforeEach(() => {
  //   orderLayoutApi.createProduct = jest.fn(() => {})
  //   orderLayoutApi.updateProduct = jest.fn(() => {})
  //
  //   orderLayoutApi.createProductLayout = jest.fn(() => {})
  //   orderLayoutApi.updateProductLayout = jest.fn(() => {})
  // })

  // afterEach(() => {
  //   orderLayoutApi.createProduct = _createProduct
  //   orderLayoutApi.updateProduct = _updateProduct
  //
  //   orderLayoutApi.createProductLayout = _createProductLayout
  //   orderLayoutApi.updateProductLayout = _updateProductLayout
  // })

  describe('selectedProduct', () => {
    it('should null if product layout is not selected', () => {
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

  describe('production action', () => {
    it('should copy product', async () => {
      // setup
      const mockProductLayout = {
        _id: 'prodLayoutId_12345',
        product: {
          _id: 'prodId_12345',
          id: '12',
          name: 'Cake',
          price: 10
        },
        top: 0,
        left: 0,
        color: 'red',
        type: 'Div.Article',
        text: ''
      }

      const mockEmptyProductLayout = {
        _id: null,
        top: 0,
        left: 1,
        type: 'Article',
        text: ''
      }

      // cate with 1 row 2 col. 1 col contain real product, 1 col contains empty
      updateSelectedCategoryLayout({
        _id: 'cateId',
        rows: 1,
        columns: 2,
        products: [mockProductLayout, mockEmptyProductLayout],
      })

      // simulate select product layout at (0, 0)
      updateSelectedProductLayout(mockProductLayout)

      // simulate click to copy action
      setAction('copy')


      // mock
      orderLayoutApi.createProduct = jest.fn(async product => ({ ...product, _id: 'fake_prod_id' }))

      // now click to blank product layout
      updateSelectedProductLayout(mockEmptyProductLayout)

      // expect product will be created by copied info with info
      // remove _id prop
      // increase id from 12 to 13, auto convert to number
      // copy another info
      expect(orderLayoutApi.createProduct.mock.calls[0][0]).toEqual({
        id: 13,
        name: 'Cake',
        price: 10
      })

      expect(orderLayoutApi.createProductLayout.mock.calls.length).toBe(1)
      expect(orderLayoutApi.createProductLayout.mock.calls[0]).toEqual([
        layoutType.value,
        'cateId',
        {
          product: 'fake_prod_id',
          top: 0,
          left: 1,
          color: 'red',
          type: 'Div.Article',
          text: ''
        }
      ])
    })

    it('should switch product', () => {
      expect(true).toBe(false)
    })
  });
})
