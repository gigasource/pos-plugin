import _ from 'lodash'

/**
 * What difference between this class with default stub of jest?
 * It's doesn't render default slot
 *
 * @param componentName component name want to stub
 * @return {{name, setup(*=): function(): *, props}|(function())}
 */
export default (componentName) => {
  return {
    name: componentName,
    setup(props, context) {
      const postfix = "-stub" // yes we can custom it
      const stub = componentName + postfix
      // handle props
      const jestifyProps = _.reduce(props, (result, v, k) => {
        // ignore boolean value
        switch (typeof v) {
          // doesn't work
          case 'undefined':
            result[k] = 'undefined'
            break;
          case 'function':
            result[k] = `${k}()`
            break;
          case 'object':
            // stringify for better look
            result[k] = _.replace(JSON.stringify(v), /"/g, "'")
            break;
          default: // primitive -> assign directly
            result[k] = v
            break;
        }

        return result
      }, {})

      return () => <stub {...jestifyProps}></stub>
    },
  }
}
