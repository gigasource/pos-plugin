jest.useFakeTimers("modern").setSystemTime(new Date("2021-01-01").getTime());
import _ from 'lodash';


it('test time', async function (done) {
  const debounce = _.debounce(() => {
    console.log('debounce');
    done()
  }, 2000);
  debounce();
  //jest.advanceTimersByTime(5000);
})

