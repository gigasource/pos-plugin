(function () {
  var IFRAME_CONTAINER_ID = 'franchise-iframe-container'
  var IFRAME_ACTIVATOR_ID = 'franchise-embed-btn'
  var IFRAME_ID = 'franchise-iframe'
  var WEBSHOP_BREAK_POINT = 1140 // minimum size webshop desktop view

  function setAttr(obj, attrs) {
    Object.keys(attrs).forEach(function(k) {
      obj.setAttribute(k, attrs[k])
    })
  }
  function createNSEl(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag)
  }
  function setupIframeActivator() {
    var el = document.getElementById(IFRAME_ACTIVATOR_ID)
    el.onclick = function (event) {
      mountIFrame(event.target.getAttribute('data-url'))
    }
    // stylesheet
    var btnWidth = (el.getAttribute('data-width') || '100') + 'px'
    var styleEl = document.createElement('style')
    document.head.appendChild(styleEl)
    var ss = styleEl.sheet
    ss.insertRule('.franchise-embed-btn { font-family: Muli, sans-serif; font-size: 14px; display: inline-flex;align-items: center;justify-content: center;text-align: center;user-select: none;cursor: pointer;padding: 5px 10px;margin: 0 8px;line-height: 24px;border-radius: 4px;border: 1px solid transparent; position: fixed; bottom: 8px; right: 8px; z-index: 1000; width:' + btnWidth + '}')
    ss.insertRule('@keyframes rotating { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }')
  }
  function createLoading() {
    var loading = document.createElement('div')
    var svg = createNSEl('svg')
    var circle1 = createNSEl('circle')
    var circle2 = createNSEl('circle')

    setAttr(loading, {
      style:'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: -1'
    })
    setAttr(svg, {
      width: '50px',
      height: '50px',
      viewBox: '25 25 50 50',
      style: 'animation: rotating 1s linear infinite'
    })
    setAttr(circle1, {
      fill: 'transparent',
      cx: '50',
      cy: '50',
      r: '20',
      'stroke-width': '5',
      'stroke-dasharray': '0',
      'stroke-dashoffset': '0',
      stroke: '#9e9e9e'
    })
    setAttr(circle2, {
      'fill': 'transparent',
      'cx': '50',
      'cy': '50',
      'r': '20',
      'stroke-width': '5',
      'stroke-dasharray': '120',
      'stroke-dashoffset': '105',
      'stroke': '#efefef'
    })

    svg.appendChild(circle1)
    svg.appendChild(circle2)
    loading.appendChild(svg)
    return loading
  }
  function createIframe(url, onIframeLoaded) {
    var iframe = document.createElement('iframe')
    setAttr(iframe, {
      src: url,
      id: IFRAME_ID,
      style: `border: none; width: 100%; height: 100%; max-width: ${WEBSHOP_BREAK_POINT}px; display: block; margin: 0 auto;`
    })
    iframe.addEventListener('load', onIframeLoaded)
    return iframe
  }
  function mountIFrame(url) {
    window.location = '#'

    // show an overlay, close overlay when click event raised
    var container = document.createElement('div')
    container.onclick = function() {
      console.log('on overlay clicked')
      unmountIFrame()
    }
    setAttr(container, {
      id: IFRAME_CONTAINER_ID,
      style: 'position: fixed; z-index: 1001; top: 0; left: 0; bottom: 0; right: 0; background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(1.5px); visibility: visible'
    })

    var loading = createLoading()
    var iframe = createIframe(url, function () {
      document.body.style.overflow = 'hidden'
      if (container.contains(loading))
        container.removeChild(loading)
    })
    container.appendChild(loading)
    container.appendChild(iframe)
    document.body.appendChild(container)

    // hide container on history back()
    window.onpopstate = function (e) {
      if (document.body.contains(container)) {
        e.preventDefault()
        document.body.removeChild(container)
      }
    }

    // listen close message from iframe
    window.addEventListener('message', function(e) {
      if (e.data === 'close-iframe')
        unmountIFrame()
    })
  }
  function unmountIFrame() {
    var container = document.getElementById(IFRAME_CONTAINER_ID)
    if(document.body.contains(container))
      document.body.removeChild(container)
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setupIframeActivator()
  } else {
    window.addEventListener('load', setupIframeActivator)
  }
})()
