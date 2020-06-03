(function () {
  window.mobileCheck = function () {
    var check = false;
    (function (a) {
      if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true;
    })(navigator.userAgent || navigator.vendor || window.opera);
    return check;
  };

  function getEmbed() {
    var el = document.getElementById('webshop-embed-btn')

    var styleEl = document.createElement('style')
    document.head.appendChild(styleEl)
    var stylesheet = styleEl.sheet
    stylesheet.insertRule('.webshop-embed-btn { font-family: Muli, sans-serif; color: white; background: #536dfe;font-size: 14px; display: inline-flex;align-items: center;justify-content: center;text-align: center;user-select: none;cursor: pointer;padding: 5px 10px;margin: 0 8px;line-height: 24px;border-radius: 4px;border: 1px solid transparent; position: fixed; bottom: 8px; right: 8px; z-index: 1000}')
    stylesheet.insertRule('@keyframes rotating { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }')

    el.onclick = function (event) {
      var isMobile = mobileCheck()
      var url = event.target.getAttribute('data-url')
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
        container.setAttribute('style', 'position: fixed; z-index: 999; top: 0; left: 0; bottom: 0; right: 0; background: rgba(0, 0, 0, 0.25); backdrop-filter: blur(1.5px); visibility: visible')
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
        circle1.setAttribute('stroke-width', '10')
        circle1.setAttribute('stroke-dasharray', '0')
        circle1.setAttribute('stroke-dashoffset', '0')
        circle1.setAttribute('stroke', '#9e9e9e')
        svg.appendChild(circle1)
        var circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle2.setAttribute('fill', 'transparent')
        circle2.setAttribute('cx', '50')
        circle2.setAttribute('cy', '50')
        circle2.setAttribute('r', '20')
        circle2.setAttribute('stroke-width', '10')
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
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    getEmbed()
  } else {
    window.addEventListener('load', getEmbed)
  }
})()
