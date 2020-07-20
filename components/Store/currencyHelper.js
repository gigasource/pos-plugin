export function currencyCodeToSymbol(currencyCode) {
  switch (currencyCode) {
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'USD':
    default:
      return '$';
  }
}

export function currencySymbolToCode(currencySymbol) {
  switch (currencySymbol) {
    case '€': return 'EUR';
    case '£': return 'GBP';
    case '$':
    default:
      return 'USD'
  }
}
