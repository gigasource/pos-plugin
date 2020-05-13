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

export function autoResizeTextarea(selector) {
  const textareas = document.querySelectorAll(selector);
  for (const textarea of textareas) {
    textarea.setAttribute('style', 'height:' + (textarea.scrollHeight) + 'px');
    textarea.addEventListener('input', function() {
      this.style.height = 'auto'
      this.style.height = (this.scrollHeight) + 'px'
    }, false)
  }
}
