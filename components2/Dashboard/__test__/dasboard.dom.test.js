import { makeWrapper, wrapper } from '../../test-utils';
import PosDashboard from '../PosDashboard';

describe('test dashboard', () => {
  it('should render', () => {
    makeWrapper(PosDashboard)
    expect(wrapper.html()).toMatchSnapshot()
  })
})
