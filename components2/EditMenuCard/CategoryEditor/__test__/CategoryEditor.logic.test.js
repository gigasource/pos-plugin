import _ from 'lodash'
import { reactive, nextTick } from 'vue'
import { orderLayout, selectedCategoryLayout } from '../../../OrderView/pos-ui-shared'

import {
  productRows,
  productCols,
  categoryName,
  categoryColor,
  debouncedUpdateCategory
} from '../category-editor-category'

import {
  categoryRows,
  categoryColumns,
  //
  createLayout,
  changeCategoryColumn,
  changeCategoryRow,
  deleteCategory,
  setAction,
  canSwitch
} from '../category-editor-order-layout'

import orderLayoutApi from '../../orderLayoutApi';

describe('Logic:CategoryEditor', () => {
  describe('changeCategoryColumn', () => {
    // the same to update categories row
    it('should update change categories column', async () => {
      const orderLayoutId = 1
      const returnedOrderLayout = {
        _id: 'whatEver',
        columns: 100
      }
      orderLayout.value._id = orderLayoutId
      orderLayoutApi.changeCategoryColumn = jest.fn(() => {
        return returnedOrderLayout
      })

      const newColumn = 5
      // try to change column
      await changeCategoryColumn(newColumn)

      // expect orderLayoutApi.changeCategoryColumn call 1
      expect(orderLayoutApi.changeCategoryColumn.mock.calls.length).toBe(1)

      // expect changeCategoryColumn call with (orderLayoutId, newColumn)
      expect(orderLayoutApi.changeCategoryColumn.mock.calls[0].length).toBe(2)
      expect(orderLayoutApi.changeCategoryColumn.mock.calls[0][0]).toBe(orderLayoutId)
      expect(orderLayoutApi.changeCategoryColumn.mock.calls[0][1]).toBe(newColumn)

      // expect that returned result will be pass to updateOrderLayout
      // it's depend on external function: updateOrderLayout (but don't know how to mock yet)
      expect(orderLayout.value).toEqual(returnedOrderLayout)
    })
  })

  describe('updateCategory', () => {
    it('should assign change to selectedCategoryLayout', async (done) => {
      selectedCategoryLayout.value = { abc: 'xyz' }
      const change = { row: 1, column: 2, color: '#FFF' }
      debouncedUpdateCategory(change)
      setTimeout(() => {
        expect(selectedCategoryLayout.value).toEqual(Object.assign(selectedCategoryLayout.value, change))
        done()
      }, 500)
    })

    it('should create new category layout __if__ forceCreate is true and selectedCategoryLayout._id is null', async (done) => {
      const updateResult = { just: 'dont care' }
      orderLayoutApi.createCategoryLayout = jest.fn(() => updateResult)

      const orderLayoutId = 'what ever'
      orderLayout.value = { _id: orderLayoutId }
      selectedCategoryLayout.value = {}

      const change = { row: 1, column: 2, color: '#FFF' }
      debouncedUpdateCategory(change, true /*forceCreate*/)

      setTimeout(() => {
        // expect orderLayoutApi.createCategoryLayout will be call (orderLayoutId, selectedCategoryLayoutValue) once
        expect(orderLayoutApi.createCategoryLayout.mock.calls.length).toBe(1)
        expect(orderLayoutApi.createCategoryLayout.mock.calls[0].length).toBe(2)
        expect(orderLayoutApi.createCategoryLayout.mock.calls[0][0]).toBe(orderLayoutId)
        expect(orderLayoutApi.createCategoryLayout.mock.calls[0][1]).toEqual(change)

        // expect returned result of orderLayoutApi.createCategoryLayout will be updated to orderLayout
        expect(orderLayout.value).toEqual(updateResult)

        done()
      }, 500 /*because debouncedUpdateCategory is 300*/)
    })

    it('should update category __if__ selectedCategoryLayout._id exist', async (done) => {
      orderLayoutApi.updateCategoryLayout = jest.fn(() => null)

      const selectedCategoryLayoutId = 1
      orderLayout.value = { _id: 'what ever' }
      selectedCategoryLayout.value = { _id: selectedCategoryLayoutId }

      const change = { row: 1, column: 2, color: '#FFF' }
      debouncedUpdateCategory(change)

      setTimeout(() => {
        // expect orderLayoutApi.updateCategoryLayout will be call (orderLayoutId, selectedCategoryLayoutValue) once
        expect(orderLayoutApi.updateCategoryLayout.mock.calls.length).toBe(1)
        expect(orderLayoutApi.updateCategoryLayout.mock.calls[0].length).toBe(2)
        expect(orderLayoutApi.updateCategoryLayout.mock.calls[0][0]).toBe(selectedCategoryLayoutId)
        expect(orderLayoutApi.updateCategoryLayout.mock.calls[0][1]).toEqual(change)

        // expect updateOrderLayout called 0 time
        // (a.k.a orderLayoutApi.updateCategoryLayout result won't be apply to orderLayout)
        expect(orderLayout.value).toEqual({ _id: 'what ever' })

        // but category layout will be update in memory
        expect(selectedCategoryLayout.value).toEqual(Object.assign(selectedCategoryLayout.value, change))

        done()
      }, 500 /*because debouncedUpdateCategory is 300*/)
    })
  })
})
