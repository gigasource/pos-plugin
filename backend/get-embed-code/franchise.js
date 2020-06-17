(function () {
  function getEmbed() {
    var el = document.getElementById('franchise-embed-btn')
    var buttonWidth = (el.getAttribute('data-width') || '100') + 'px'

    var styleEl = document.createElement('style')
    document.head.appendChild(styleEl)
    var stylesheet = styleEl.sheet
    stylesheet.insertRule('.franchise-embed-btn { font-family: Muli, sans-serif; font-size: 14px; display: inline-flex;align-items: center;justify-content: center;text-align: center;user-select: none;cursor: pointer; background: #1271FF; color: #FFF; padding: 5px 10px;margin: 0 8px;line-height: 24px;border-radius: 4px;border: 1px solid transparent; width:' + buttonWidth + '}')
    stylesheet.insertRule('@keyframes rotating { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }')
    stylesheet.insertRule('@media screen and (min-width: 410px) { #reservation-iframe { width: 410px !important; margin-left: calc(50% - 205px); } }')
    stylesheet.insertRule('@media screen and (max-width: 410px) { #iframe-close-btn { transform: scale(1.2) !important; right: 10px !important } }')

    el.onclick = function (event) {
      var url = event.target.getAttribute('data-url')
      window.location = '#'

      // insert overlay
      var container = document.createElement('div')
      container.setAttribute('id', 'franchise-iframe-container')
      container.setAttribute('style', 'position: fixed; z-index: 1001; top: 0; left: 0; bottom: 0; right: 0; background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(1.5px); visibility: visible')
      document.body.appendChild(container)

      container.onclick = function () {
        if(document.body.contains(container))
          document.body.removeChild(container)
      }

      //insert loading circular
      var loading = document.createElement('div')
      loading.setAttribute('style', 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: -1')
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      svg.setAttribute('width', '50px')
      svg.setAttribute('height', '50px')
      svg.setAttribute('viewBox', '25 25 50 50')
      svg.setAttribute('style', 'animation: rotating 1s linear infinite')
      var circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle1.setAttribute('fill', 'transparent')
      circle1.setAttribute('cx', '50')
      circle1.setAttribute('cy', '50')
      circle1.setAttribute('r', '20')
      circle1.setAttribute('stroke-width', '5')
      circle1.setAttribute('stroke-dasharray', '0')
      circle1.setAttribute('stroke-dashoffset', '0')
      circle1.setAttribute('stroke', '#9e9e9e')
      svg.appendChild(circle1)
      var circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle2.setAttribute('fill', 'transparent')
      circle2.setAttribute('cx', '50')
      circle2.setAttribute('cy', '50')
      circle2.setAttribute('r', '20')
      circle2.setAttribute('stroke-width', '5')
      circle2.setAttribute('stroke-dasharray', '120')
      circle2.setAttribute('stroke-dashoffset', '105')
      circle2.setAttribute('stroke', '#efefef')
      svg.appendChild(circle2)
      loading.appendChild(svg)
      container.appendChild(loading)

      // insert iframe
      var iframe = document.createElement('iframe')
      iframe.setAttribute('src', url)
      iframe.setAttribute('id', 'franchise-iframe')
      var iframeStyle = 'border: none; width: 100%; height: 100%'

      // hide container on history back()
      window.onpopstate = function (e) {
        if (document.body.contains(container)) {
          e.preventDefault()
          document.body.removeChild(container)
        }
      }

      iframe.setAttribute('style', iframeStyle)
      container.appendChild(iframe)
      iframe.addEventListener('load', function () {
        document.body.style.overflow = 'hidden'
        container.removeChild(loading)
      })
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    getEmbed()
  } else {
    window.addEventListener('load', getEmbed)
  }
})()
