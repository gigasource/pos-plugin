export const actionMap = {
  insert: (value, append) => (value + append),
  delete: (value) => value.substring(0, value.length - 1),
  shift: (isShift) => (!isShift),
  enter: () => {
  },
  x: val => val.includes(' x ') ? val : `${val} x `
}

export const defaultKeyboard = {
  columns: 3,
  rows: 4,
  items: [
    {top: 1, left: 1, bottom: 2, right: 2, value: '7', type: 'text'},
    {top: 1, left: 2, bottom: 2, right: 3, value: '8', type: 'text'},
    {top: 1, left: 3, bottom: 2, right: 4, value: '9', type: 'text'},
    {top: 2, left: 1, bottom: 3, right: 2, value: '4', type: 'text'},
    {top: 2, left: 2, bottom: 3, right: 3, value: '5', type: 'text'},
    {top: 2, left: 3, bottom: 3, right: 4, value: '6', type: 'text'},
    {top: 3, left: 1, bottom: 4, right: 2, value: '1', type: 'text'},
    {top: 3, left: 2, bottom: 4, right: 3, value: '2', type: 'text'},
    {top: 3, left: 3, bottom: 4, right: 4, value: '3', type: 'text'},
    {top: 4, left: 1, bottom: 5, right: 2, value: '0', type: 'text'},
    {top: 4, left: 2, bottom: 5, right: 3, value: ' x ', type: 'x'},
    {top: 4, left: 3, bottom: 5, right: 4, type: 'enter'},
  ],
}
