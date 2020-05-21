export function getCdnUrl(url) {
  if (cms.sharedConfig && cms.sharedConfig.getCdnUrl && cms.sharedConfig.USE_CDN)
    return cms.sharedConfig.getCdnUrl(url)
  return url
}
