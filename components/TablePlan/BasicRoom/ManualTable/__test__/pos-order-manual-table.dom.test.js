import { makeWrapper, wrapper } from '../../../../test-utils';
import PosOrderManualTable from '../PosOrderManualTable';

describe('test dashboard', () => {
  it('should render', () => {
    makeWrapper(PosOrderManualTable)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
