const { reactive } = require('vue')
// TODO: update test
import {
  productRows,
  productCols,
  categoryName,
  categoryColor,
  debouncedUpdateCategory
} from './category-editor-category'

import {
  hasOrderLayout,
  categoryRows,
  categoryColumns,
  //
  createLayout,
  changeCategoryColumn,
  changeCategoryRow,
  deleteCategory,
  setAction,
  canSwitch
} from './category-editor-order-layout'

describe('Logic:CategoryEditor', () => {
  let _cms
  let _console
  let context

  beforeEach(() => {
    // cache cms
    _cms = global.cms

    // cache & mock global.console
    _console = global.console
    const _log = global.console.log
    const _warn = global.console.warn
    const _error = global.console.error
    global.console = {
      log: jest.fn(function() { _log(...arguments) }),
      warn: jest.fn(function() { _warn(...arguments) }),
      error: jest.fn(function() { _error(...arguments) }),
    }

    // mock contexgt
    context = { emit: jest.fn(x => x) }
  })
  afterEach(() => {
    global.cms = _cms
    global.console = _console

    context = null
  })

  function cmsMock(returnResult) {
    const findOneAndUpdate = jest.fn(() => new Promise(r => r(returnResult)))
    const getModel = jest.fn(() => ({ findOneAndUpdate }))
    global.cms = { getModel }
    return { getModel, findOneAndUpdate }
  }

  describe('changeOrderLayoutColumn', () => {
    // the same to update categories row
    it('should update change categories column', async () => {
      const props = reactive({
        orderLayout: {
          _id: 1
        }
      })

      // mock cms
      const findOneAndUpdateResult = 'what ever'
      const { getModel, findOneAndUpdate } = cmsMock(findOneAndUpdateResult)
      let { changeOrderLayoutColumn } = CategoryEditorLogic(props, context)

      const newColumn = 5
      // try to change column
      await changeOrderLayoutColumn(newColumn)

      // expect cms.getModel call 1
      expect(getModel.mock.calls.length).toBe(1)

      // expect cms.getModel call with 'OrderLayout'
      expect(getModel.mock.calls[0].length).toBe(1)
      expect(getModel.mock.calls[0][0]).toBe('OrderLayout')

      // expect findOneAndUpdate call ({_id: props.orderLayout._id}, { columns }, { new: true })
      expect(findOneAndUpdate.mock.calls.length).toBe(1)
      expect(findOneAndUpdate.mock.calls[0][0]).toEqual({_id: props.orderLayout._id})
      expect(findOneAndUpdate.mock.calls[0][1]).toEqual({columns: newColumn})
      expect(findOneAndUpdate.mock.calls[0][2]).toEqual({new: true})

      // TODO: expect showNotify will be call 1

      // expect emit will be call 1
      expect(context.emit.mock.calls.length).toBe(1)
      expect(context.emit.mock.calls[0][0]).toBe('update:orderLayout')
      expect(context.emit.mock.calls[0][1]).toBe(findOneAndUpdateResult)
    })
  })

  describe('updateCategory', () => {
    it('should assign change to props.selectedCategoryLayout', async () => {
      const props = reactive({ selectedCategoryLayout: { abc: 'xyz' } })

      let { updateCategory } = CategoryEditorLogic(props, context)
      const change = { row: 1, column: 2, color: '#FFF' }
      await updateCategory(change)

      expect(props.selectedCategoryLayout).toEqual(Object.assign(props.selectedCategoryLayout, change))
    })
    it('should log __if__ forceCreate is falsy and selectedCategoryLayout._id is not defined or null', async () => {
      const props = reactive({ selectedCategoryLayout: { abc: 'xyz' } })
      let { updateCategory } = CategoryEditorLogic(props, context)
      await updateCategory({ row: 1, column: 2, color: '#FFF' })
      expect(global.console.log.mock.calls.length).toBe(1)
      expect(global.console.log.mock.calls[0][0]).toBe('CategoryLayout is not existed. Skip.')
    })
    it('should create new category layout __if__ forceCreate is true and selectedCategoryLayout._id is null', async () => {
      const updateResult = {
        just: 'dont care'
      }
      const { getModel, findOneAndUpdate } = cmsMock(updateResult)
      const props = reactive({
        orderLayout: { _id: 'what ever' },
        selectedCategoryLayout: { }
      })
      const change = { row: 1, column: 2, color: '#FFF' }
      const set = {
        'categories.$.row': 1,
        'categories.$.column': 2,
        'categories.$.color': 3,
      }
      let { updateCategory } = CategoryEditorLogic(props, context)
      await updateCategory(change, true /*forceCreate*/)

      // expect cms.getModel call with 'OrderLayout'
      expect(getModel.mock.calls[0].length).toBe(1)
      expect(getModel.mock.calls[0][0]).toBe('OrderLayout')

      // expect findOneAndUpdate with correct arguments
      expect(findOneAndUpdate.mock.calls.length).toBe(1)
      expect(findOneAndUpdate.mock.calls[0].length).toBe(3)
      expect(findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: props.orderLayout._id })
      expect(findOneAndUpdate.mock.calls[0][1]).toEqual({ $push: { categories: props.selectedCategoryLayout } })
      expect(findOneAndUpdate.mock.calls[0][2]).toEqual({ new: true })

      // expect return result from create will be emit
      expect(context.emit.mock.calls.length).toBe(1)
      expect(context.emit.mock.calls[0][0]).toBe('update:orderLayout')
      expect(context.emit.mock.calls[0][1]).toEqual(updateResult)
    })
    it('should update category __if__ selectedCategoryLayout._id exist', async () => {
      // mock cms
      const { getModel, findOneAndUpdate } = cmsMock('dont care')

      const selectedCategoryLayoutId = 1
      const props = reactive({
        orderLayout: { _id: 'what ever' },
        selectedCategoryLayout: { _id: selectedCategoryLayoutId }
      })
      let { updateCategory } = CategoryEditorLogic(props, context)
      const change = { row: 1, column: 2, color: '#FFF' }
      const set = {
        'categories.$.row': 1,
        'categories.$.column': 2,
        'categories.$.color': '#FFF',
      }
      await updateCategory(change)

      // expect cms.getModel call with 'OrderLayout'
      expect(getModel.mock.calls[0].length).toBe(1)
      expect(getModel.mock.calls[0][0]).toBe('OrderLayout')

      // expect findOneAndUpdate with correct arguments
      expect(findOneAndUpdate.mock.calls.length).toBe(1)
      expect(findOneAndUpdate.mock.calls[0].length).toBe(2)
      expect(findOneAndUpdate.mock.calls[0][0]).toEqual({ 'categories._id': selectedCategoryLayoutId })
      expect(findOneAndUpdate.mock.calls[0][1]).toEqual({ $set: set })
    })
  })
})
