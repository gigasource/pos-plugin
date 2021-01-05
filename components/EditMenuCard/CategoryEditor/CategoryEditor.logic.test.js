import { reactive } from 'vue'
import CategoryEditorLogic from './CategoryEditorLogic';

describe('Logic:CategoryEditor', () => {
  it('should update change categories column', () => {
    const props = reactive({
      orderLayout: {
        _id: 1
      }
    })

    const context = {
      emit: jest.fn(x => x)
    }

    const findOneAndUpdateResult = 'what ever'
    const findOneAndUpdate = jest.fn(() => () => findOneAndUpdateResult)

    // mock cms
    const getModel = jest.fn(() => () => ({
      findOneAndUpdate
    }))

    let _cms = window.cms;
    window.cms = { getModel }

    let { changeOrderLayoutColumn, showNotify } = CategoryEditorLogic(props, context)

    let _showNotify = showNotify
    showNotify = jest.fn(function() {
      _showNotify(...arguments)
    })

    const newColumn = 5
    // try to change column
    changeOrderLayoutColumn(newColumn)

    // expect cms.getModel call 1
    expect(cms.getModel.calls.length).toBe(1)

    // expect cms.getModel call with 'OrderLayout'
    expect(cms.getModel.calls[0].length).toBe(1)
    expect(cms.getModel.calls[0][0]).toBe('OrderLayout')

    // expect findOneAndUpdate call ({_id: props.orderLayout._id}, { columns }, { new: true })
    expect(findOneAndUpdate.calls.length).toBe(1)
    expect(findOneAndUpdate.calls[0][0]).toEqual({_id: props.orderLayout._id})
    expect(findOneAndUpdate.calls[0][1]).toEqual({columns: newColumn})
    expect(findOneAndUpdate.calls[0][2]).toEqual({new: true})

    // expect showNotify will be call 1
    expect(showNotify.calls.length).toBe(1)

    // expect emit will be call 1
    expect(context.emit.calls.length).toBe(1)
    expect(context.emit.calls[0][0]).toBe('update:orderLayout')
    expect(context.emit.calls[0][1]).toBe(findOneAndUpdateResult)


    window.cms = _cms
  })
})
