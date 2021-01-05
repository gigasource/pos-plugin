/**
 * @jest-environment jsdom
 */

import { reactive } from 'vue'
import { mount } from '@vue/test-utils'
import CategoryEditorFactory from './CategoryEditorFactory'
import cms from '../../../../../backoffice/src/cms';

describe('Visual:CategoryEditor', function () {
  beforeEach(() => {

  })

  afterEach(() => {

  })

  describe('Categories_Layout', () => {
    it('should', async () => {
      const { hooks, fn } = CategoryEditorFactory()
      hooks.on('renderPopUp', function(
          renderCategoryLayoutSetting,
          renderCateNameSetting,
          renderCateColorSetting,
          renderCateProductLayoutSetting,
          renderPopUp) {
        this.update('renderCategoryEditor', () => (
            <>
              { renderCategoryLayoutSetting() }
            </>
        ))
      })

      const component = fn()
      const i18n = createI18n({
        locale: cms.locale,
        fallbackLocale: 'en',
        messages: cms.i18n
      })
      const wrapper = mount(component, {
        plugins: [i18n]
      })
      expect(wrapper.html()).toMatchSnapshot()
    })
  })

});
