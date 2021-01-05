import { reactive } from 'vue'
import CategoryEditorFactory from './CategoryEditorFactory'

describe('Visual:CategoryEditor', function () {
  beforeEach(() => {

  })

  afterEach(() => {

  })

  describe('Categories Layout', () => {
    const { hooks, fn } = CategoryEditorFactory()


    hooks.on('renderPopUp', function(
        renderCategoryLayoutSetting,
        renderCateNameSetting,
        renderCateColorSetting,
        renderCateProductLayoutSetting,
        renderPopUp) {
      this.update('renderCategoryLayoutSetting', () => (
        <>
          { renderCategoryLayoutSetting() }
        </>
      ))
    })
  })

});
