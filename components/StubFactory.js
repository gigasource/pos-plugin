/**
 * Customize jest stub component to prevent exception in test case when template contain
 * some component which have default scoped-slot.
 *
 * This stub also allow to change some tag -> specified tag.
 *
 * Usage:
 * Normal use cases:
 *   + g-dialog: StubFactory('button') // change g-dialog to button
 *   + g-text-field-bs:  StubFactory(null, { tag: 'input' }) // change g-text-field-bs to input
 */
const StubFactory = (name, option) => {
  return {
    name,
    setup() {
      let stub = name + "-stub"

      if (option) {
        if (option.tag) {
          const tag = option.tag
          const typeOfTag = typeof(tag)
          if (typeOfTag === 'function')
            stub = tag(name)
          else if (typeOfTag === 'string')
            stub = tag
        }
      }
      return () => <stub></stub>
    }
  }
}

export default StubFactory
