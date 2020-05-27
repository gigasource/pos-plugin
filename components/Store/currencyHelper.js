export function currencyCodeToSymbol(currencyCode) {
  switch (currencyCode) {
    case 'EUR': return '€';
    case 'USD':
    default:
      return '$';
  }
}

export function currencySymbolToCode(currencySymbol) {
  switch (currencySymbol) {
    case '€': return 'EUR';
    case '$':
    default:
      return 'USD'
  }
}
