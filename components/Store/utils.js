export function getCdnUrl(url) {
  if (cms.sharedConfig && cms.sharedConfig.getCdnUrl && !cms.sharedConfig.DISABLE_CDN) return cms.sharedConfig.getCdnUrl(url)

  return url
}

/**
 * @param type franchise, reservation, webshop
 * @param locale: 'de-DE', 'en-US', 'en-GB', ... gathered from store.locale
 * @param id: store-alias (for webshop, reservation) or store group id (for franchise)
 * @returns {string} generated html code which can be used to embed into customer website
 */
export function generateEmbededScript({ type, locale, id }) {
  let dataUrl,
      scriptSrc,
      image,
      objImg,
      fallbackContent

  locale = locale || 'en-US'
  const scriptFolder = `${location.origin}/cms-files/files/view/js-scripts`
  switch (type) {
    case 'franchise':
      dataUrl = `${location.origin}/franchise/${id}`
      scriptSrc = `${scriptFolder}/franchise-embed.js`
      if (locale.startsWith('de')) {
        fallbackContent = 'Online Bestellen & Reservierung'
        image = 'online-order-de.svg'
      } else {
        fallbackContent = 'Online Order & Reservation'
        image = 'online-order-n-reservation.svg'
      }
      objImg = getCdnUrl(`${location.origin}/cms-files/files/view/images/${image}`)
      return `<div id="franchise-embed-btn" class="franchise-embed-btn" data-url="${dataUrl}" data-width="120"><object style="pointer-events: none; width: 120px" type="image/svg+xml" data="${objImg}">${fallbackContent}</object></div><script type="application/javascript" src="${scriptSrc}"><\/script>`
    case 'webshop':
      dataUrl = `${location.origin}/store/${id}`
      scriptSrc = `${scriptFolder}/webshop-embed.js`
      if (locale.startsWith('de')) {
        fallbackContent = 'Online Bestellen'
        image = 'online-order-de.svg'
      } else {
        fallbackContent = 'Online Order'
        image = 'online-order.svg'
      }
      objImg = getCdnUrl(`${location.origin}/cms-files/files/view/images/${image}`)
      return `<div id="webshop-embed-btn" class="webshop-embed-btn" data-url="${dataUrl}" data-width="120"><object style="pointer-events: none; width: 120px" type="image/svg+xml" data="${objImg}">${fallbackContent}</object></div><script type="application/javascript" src="${scriptSrc}"><\/script>`
    case 'reservation':
      dataUrl = `${location.origin}/reservation/${id}`
      scriptSrc = `${scriptFolder}/reservation-embed.js`
      return `<div id="reservation-embed-btn" class="reservation-embed-btn" data-url="${dataUrl}" data-width="120">Reservation</div><script type="application/javascript" src="${scriptSrc}"><\/script>`
    default:
      console.warn('embeded type is missing')
  }
}

export async function copyToClipboard(content) {
  await navigator.clipboard.writeText(content)
}
