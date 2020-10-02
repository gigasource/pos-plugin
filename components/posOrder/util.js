export function createEmptyProductLayout() {
  return {
    type: 'Article',
    text: '',
    color: '#F5F5F5',
    product: {
      type: null,
      id: '',
      name: '',
      price: '',
      groupPrinter: null,
      groupPrinter2: null,
      isNoPrint: null,
      isItemNote: null,
      tax: null,
      tax2: null,
      category: null,
      isDivArticle: null
    }
  }
}
