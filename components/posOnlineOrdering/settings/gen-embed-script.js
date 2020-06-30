export function getEmbedWebshop() {
  return `function getEmbedWebshop() {
  var el = document.getElementById('webshop-embed-btn')

  var styleEl = document.createElement('style')
  document.head.appendChild(styleEl)
  var stylesheet = styleEl.sheet
  stylesheet.insertRule('.webshop-embed-btn { font-family: Muli, sans-serif; font-size: 14px; display: inline-flex;align-items: center;justify-content: center;text-align: center;user-select: none;cursor: pointer;padding: 5px 10px;margin: 0 8px;line-height: 24px;border-radius: 4px;border: 1px solid transparent; position: fixed; z-index: 1000;}')
  stylesheet.insertRule('@keyframes rotating { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }')

  var url = el.getAttribute('data-url')

  getStyleSheet()

  function openIframe () {
    window.location = '#'

    var existingIframe = document.getElementById('webshop-iframe-container');

    if (existingIframe) {
      if (existingIframe.style.visibility === 'hidden') {
        existingIframe.style.visibility = 'visible'
        document.body.style.overflow = 'hidden'
      } else {
        existingIframe.style.visibility = 'hidden'
        document.body.style.overflow = 'auto'
      }
    } else {
      // insert overlay
      var container = document.createElement('div')
      container.setAttribute('id', 'webshop-iframe-container')
      container.setAttribute('style', 'position: fixed; z-index: 1001; top: 0; left: 0; bottom: 0; right: 0; background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(1.5px); visibility: visible')
      document.body.appendChild(container)

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
      circle2.setAttribute('stroke-dashoffset', '100')
      circle2.setAttribute('stroke', '#efefef')
      svg.appendChild(circle2)
      loading.appendChild(svg)
      container.appendChild(loading)

      // insert iframe
      var iframe = document.createElement('iframe')
      iframe.setAttribute('src', url)
      iframe.setAttribute('id', 'webshop-iframe')
      var iframeStyle = 'border: none; width: 100%; height: 100%'

      // hide container on history back()
      window.onpopstate = function (e) {
        if (container.style.visibility !== 'hidden') {
          e.preventDefault()
          container.style.visibility = 'hidden'
          document.body.style.overflow = 'auto'
        }
      }

      iframe.setAttribute('style', iframeStyle)
      container.appendChild(iframe)
      iframe.addEventListener('load', function () {
        document.body.style.overflow = 'hidden'

        container.removeChild(loading)

        // insert close btn
        var closeBtn = document.createElement('button')
        closeBtn.setAttribute('id', 'iframe-close-btn')
        closeBtn.innerText = 'CLOSE'
        closeBtn.setAttribute('style', 'position: absolute;top: 10px;right: 50%;transform: translateX(650px);height: 32px;width: 64px;font-size: 14px;')
        closeBtn.onclick = function () {
          container.style.visibility = 'hidden'
          document.body.style.overflow = 'auto'
        }
        container.appendChild(closeBtn)
      })
    }
  }

  function openNewTab() {
    window.open(url)
  }

  var isOldIOs = checkIOs12AndLess()
  var openFn = isOldIOs ? openNewTab : openIframe

  el.onclick = openFn
  //get by class webshop-btn
  var btns = document.getElementsByClassName('webshop-btn')
  for(var i = 0; i < btns.length; i++) {
    btns[i].onclick = openFn
  }

  //get by href #webshop-btn
  btns = document.querySelectorAll('a[href="#webshop-btn"]')
  for(var i = 0; i < btns.length; i++) {
    btns[i].onclick = function (e) {
      e.preventDefault()
      openFn()
    }
  }
}`
}

export function getEmbedReservation() {
  return `function getEmbedReservation() {
    var el = document.getElementById('reservation-embed-btn')
  
    var styleEl = document.createElement('style')
    document.head.appendChild(styleEl)
    var stylesheet = styleEl.sheet
    stylesheet.insertRule('.reservation-embed-btn { font-family: Muli, sans-serif; font-size: 14px; display: inline-flex;align-items: center;justify-content: center;text-align: center;user-select: none;cursor: pointer; padding: 5px 10px;margin: 0 8px;line-height: 24px;border-radius: 4px;border: 1px solid transparent; position: fixed; z-index: 1000;}')
    stylesheet.insertRule('@keyframes rotating { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }')
    stylesheet.insertRule('@media screen and (min-width: 410px) { #reservation-iframe { width: 410px !important; margin-left: calc(50% - 205px); } }')
    stylesheet.insertRule('@media screen and (max-width: 410px) { #iframe-close-btn { transform: scale(1.2) !important; right: 10px !important } }')
  
    var url = el.getAttribute('data-url')
  
    getStyleSheet()
  
    function openIframe() {
      window.location = '#'
  
      // insert overlay
      var container = document.createElement('div')
      container.setAttribute('id', 'reservation-iframe-container')
      container.setAttribute('style', 'position: fixed; z-index: 1001; top: 0; left: 0; bottom: 0; right: 0; background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(1.5px); visibility: visible')
      document.body.appendChild(container)
  
      function removeContainer() {
        if (document.body.contains(container))
          document.body.removeChild(container)
      }
  
      container.onclick = removeContainer
  
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
      iframe.setAttribute('id', 'reservation-iframe')
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
  
      window.addEventListener('message', function (e) {
        if (e.data === 'close-iframe') {
          removeContainer()
        }
      })
    }
  
    function openNewTab() {
      window.open(url)
    }
  
    var isOldIOs = checkIOs12AndLess()
    var openFn = isOldIOs ? openNewTab : openIframe
  
    el.onclick = openFn
  
    var btns = document.getElementsByClassName('reservation-btn')
    for (var i = 0; i < btns.length; i++) {
      btns[i].onclick = openFn
    }
  
    btns = document.querySelectorAll('a[href="#reservation-btn"]')
    for (var i = 0; i < btns.length; i++) {
      btns[i].onclick = function (e) {
        e.preventDefault()
        openFn()
      }
    }
  }`
}

export function genReadyState(type) {
  return `if (document.readyState === 'complete' || document.readyState === 'interactive') {
    getEmbed${type}()
  } else {
    window.addEventListener('load', getEmbed${type})
  }`
}

export function genScriptHeader() {
  return '(function () { '
}

export function genScriptFooter() {
  return ' })()'
}


export function genStyleSheet(type, position, size, hidden) {
  const className = type.toLowerCase() + '-embed-btn'
  let style = `.${className} { `

  const directions = position.split('-')
  style += directions[1] + ': 8px;'
  switch (directions[0]) {
    case 'top':
      style += 'top: 8px;';
      break;
    case 'bottom':
      style += 'bottom: 8px;';
      break;
    case 'middle':
      style += 'top: 50%; transform: translateY(-50%);';
      break;
    default:
      break;
  }

  switch (size) {
    case 'small':
      style += 'width: 80px;';
      break;
    case 'large':
      style += 'width: 120px;';
      break;
    case 'normal':
    default:
      style += 'width: 100px;';
      break;
  }

  if(hidden) {
    style += 'visibility: hidden;';
  }

  style += ' }'

  return `function getStyleSheet() {
    var styleEl = document.createElement('style')
    document.head.appendChild(styleEl)
    var stylesheet = styleEl.sheet
    stylesheet.insertRule('${style}')
  }`
}

export function checkIOs12AndLess() {
  return `function checkIOs12AndLess() {
  var userAgent = navigator.userAgent.substring(navigator.userAgent.indexOf('(') + 1, navigator.userAgent.indexOf(')'));
  if(userAgent.includes('iPhone') || userAgent.includes('iPod') || userAgent.includes('iPad')) {
    var start = userAgent.indexOf('OS ')
    if( ( userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1 ) && start > -1 ){
      return +userAgent.substr( start + 3, 3 ).replace( '_', '' ) <= 12
    }
  }
  return false
}`
}
