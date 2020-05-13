export function getCdnUrl(url) {
  if (cms.sharedConfig && cms.sharedConfig.getCdnUrl)
    return cms.sharedConfig.getCdnUrl(url)
  return url
}
