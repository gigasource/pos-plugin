export function normalizeEvent(e) {
  if (e instanceof TouchEvent && e.touches.length > 0) {
    e.clientX = e.touches[0].clientX
    e.clientY = e.touches[0].clientY
    const { left, top } = e.target.getBoundingClientRect()
    e.offsetX = e.touches[0].clientX - left
    e.offsetY = e.touches[0].clientY - top
  }
}
