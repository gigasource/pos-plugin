export function createEmptyProductLayout() {
  return {
    type: 'Article',
    text: '',
    color: '#ddd',
    product: createEmptyProduct()
  }
}

export function createEmptyProduct() {
  return {
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


export function createEmptyLayout(row, column) {
  return {
    top: row,
    left: column,
    name: ''
  }
}

export function createEmptyCategoryLayout() {
  return {
    rows: 10,
    columns: 6,
    color: '#FFF'
  }
}


export function isSameArea(area1, area2) {
  return area1.top === area2.top && area1.left === area2.left
}
