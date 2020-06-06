export function getCdnUrl(url) {
  if (cms.sharedConfig && cms.sharedConfig.getCdnUrl && !cms.sharedConfig.DISABLE_CDN) return cms.sharedConfig.getCdnUrl(url)

  return url
}
