import cms from 'cms'
import dialogEditPopupModifiers2 from '../dialogEditPopupModifiers2';

import {setComponent, wrapper, makeWrapper} from '../../test-utils';
import { currentGroup, modifiers, onCreateItem, onSelect, onRemoveItem} from '../modifier-ui-logics'
beforeAll(() => {

})

describe("test dialog edit popup modifier UI", () => {
  it("should render" , async() => {
    setComponent(dialogEditPopupModifiers2)
    makeWrapper()
    expect(wrapper.html()).toMatchInlineSnapshot()
  })
})
