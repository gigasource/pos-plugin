/**
 * What difference between this class with default stub of jest?
 * It's doesn't render default slot
 */
export default (name) => {
  return {
    name,
    setup() {
      const stub = name + "-stub"
      return () => <stub></stub>
    }
  }
}
