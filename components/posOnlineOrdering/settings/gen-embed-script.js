export function genIframe(type, link, alias) {
  return `var url${type} = ['https://restaurantplus.net', '${link}', '${alias}'].join('/')
  
  function openIframe${type} () {
    window.location = '#'

    var existingIframe = document.getElementById('${type}-iframe-container');

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
      container.setAttribute('id', '${type}-iframe-container')
      container.setAttribute('style', 'position: fixed; z-index: 1000001; top: 0; left: 0; bottom: 0; right: 0; background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(1.5px); visibility: visible')
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
      iframe.setAttribute('src', url${type})
      iframe.setAttribute('id', '${type}-iframe')
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
        if(loading && '${type}' !== 'franchise') container.removeChild(loading)
        
        ${type === 'webshop' && `if(!mobileCheck()) {
          var closeBtn = document.createElement('button')
          closeBtn.setAttribute('id', 'iframe-close-btn')
          closeBtn.setAttribute('style', 'position: absolute;top: 10px;right: 50%;transform: translateX(650px);padding: 16px;font-size: 14px;')
          var icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
          icon.setAttribute('width', '20px')
          icon.setAttribute('height', '20px')
          icon.setAttribute('viewBox', '0 0 20 20')
          var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
          polygon.setAttribute('fill', 'black')
          polygon.setAttribute('points', '19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4 6.4 5 12 10.6 17.6 5 19 6.4 13.4 12')
          icon.appendChild(polygon)
          closeBtn.appendChild(icon)
          closeBtn.onclick = function () {
            container.style.visibility = 'hidden'
            document.body.style.overflow = 'auto'
          }
          container.appendChild(closeBtn)
        }`}
      })
  
      window.addEventListener('message', function (e) {
        if (e.data === 'close-iframe') {
          document.body.style.overflow = ''
          var existingIframe = document.getElementById('${type}-iframe-container');
          if(existingIframe) document.body.removeChild(existingIframe)
        }
      })
    }
  }

  function openNewTab${type}() {
    window.open(url${type})
  }

  var openFn${type} = isOldIOs ? openNewTab${type} : openIframe${type}
  
  //get by class ${type}-btn
  var btns = document.getElementsByClassName('${type}-btn')
  for(var i = 0; i < btns.length; i++) {
    btns[i].onclick = openFn${type}
  }

  //get by href #${type}-btn
  btns = document.querySelectorAll('a[href="#${type}-btn"]')
  for(var i = 0; i < btns.length; i++) {
    btns[i].onclick = function (e) {
      e.preventDefault()
      openFn${type}()
    }
  }\n`
}

export function getEmbedBtn(types, alias) {
  let typeIframeScript = ''
  for(const type of types) {
    typeIframeScript += genIframe(type.type, type.link, alias)
  }
  return `function getEmbedBtn() {
      var el = document.getElementById('restaurant-plus-embed-btn');
      getStyleSheet();
      var isOldIOs = checkIOs12AndLess();
      ${typeIframeScript}
      el.onclick = openFn${types[0].type}
  }`
}

export function genReadyState() {
  return `if (document.readyState === 'complete' || document.readyState === 'interactive') {
       getEmbedBtn()
     } else {
        window.addEventListener('load', getEmbedBtn)
     }`
}

export function genScriptHeader() {
  return '(function () { '
}

export function genScriptFooter() {
  return ' })()'
}


export function genStyleSheet(position, size, hidden) {
  let style = `.restaurant-plus-embed-btn { position: fixed; z-index: 1000000; cursor: pointer; -webkit-tap-highlight-color: transparent;`

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

  let width = 0

  switch (size) {
    case 'small':
      style += 'width: 80px;';
      width = '80px';
      break;
    case 'large':
      style += 'width: 120px;';
      width = '120px';
      break;
    case 'normal':
    default:
      style += 'width: 100px;';
      width = '100px';
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
    stylesheet.insertRule('@keyframes rotating { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }')
    stylesheet.insertRule('.restaurant-plus-embed-btn object { pointer-events: none; max-width: ${width} }')
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

export function mobileCheck() {
  return `function mobileCheck () {
    var check = false;
    (function (a) {
      if (/(android|bb\\d+|meego).+mobile|avantgo|bada\\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\\-(n|u)|c55\\/|capi|ccwa|cdm\\-|cell|chtm|cldc|cmd\\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\\-s|devi|dica|dmob|do(c|p)o|ds(12|\\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\\-|_)|g1 u|g560|gene|gf\\-5|g\\-mo|go(\\.w|od)|gr(ad|un)|haie|hcit|hd\\-(m|p|t)|hei\\-|hi(pt|ta)|hp( i|ip)|hs\\-c|ht(c(\\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\\-(20|go|ma)|i230|iac( |\\-|\\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\\/)|klon|kpt |kwc\\-|kyo(c|k)|le(no|xi)|lg( g|\\/(k|l|u)|50|54|\\-[a-w])|libw|lynx|m1\\-w|m3ga|m50\\/|ma(te|ui|xo)|mc(01|21|ca)|m\\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\\-2|po(ck|rt|se)|prox|psio|pt\\-g|qa\\-a|qc(07|12|21|32|60|\\-[2-7]|i\\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\\-|oo|p\\-)|sdk\\/|se(c(\\-|0|1)|47|mc|nd|ri)|sgh\\-|shar|sie(\\-|m)|sk\\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\\-|v\\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\\-|tdg\\-|tel(i|m)|tim\\-|t\\-mo|to(pl|sh)|ts(70|m\\-|m3|m5)|tx\\-9|up(\\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\\-|your|zeto|zte\\-/i.test(a.substr(0, 4))) check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
  };`
}

export function genIcon(alias, mimeType, ext, location) {
  return `(function () {
    var el = document.getElementById('restaurant-plus-embed-btn')
    if(!el) {
      el = document.createElement('div')
      el.id = 'restaurant-plus-embed-btn'
      el.classList.add('restaurant-plus-embed-btn')
      document.body.appendChild(el)
    }
    if(el && !el.hasChildNodes()) {
      var url = ['${location}', 'cms-files', 'files', 'view', 'store', '${alias}', 'embed-icon.${ext}'].join('/')
      var image = document.createElement('object')
      image.setAttribute('type', '${mimeType}')
      image.setAttribute('data', url)
      image.innerText = 'Online Order'
      el.appendChild(image)
    }
  })();`
}
