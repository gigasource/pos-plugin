export function getCdnUrl(url) {
  if (cms.sharedConfig && cms.sharedConfig.getCdnUrl && !cms.sharedConfig.DISABLE_CDN) return cms.sharedConfig.getCdnUrl(url)

  return url
}

export function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  })
}
