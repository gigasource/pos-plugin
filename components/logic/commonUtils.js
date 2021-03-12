export function getProvided(collection, vm) {
  return _.reduce(collection, (acc, value, key) => {
    acc = vm[key]
      ? Object.assign(acc, {
        [key]: vm[key]
      })
      : acc

    return acc
  }, {})
}
