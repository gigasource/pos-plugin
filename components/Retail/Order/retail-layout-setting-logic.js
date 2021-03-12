import {onActivated, reactive, ref} from "vue";

export const retailLayoutSetting = reactive({
  productRow: 4,
  productColumn: 4,
  productFontSize: 12,
  showFullProductName: false
})

export function changeValue(propName, value) {
  retailLayoutSetting[propName] = value
}

export function saveRetailLayoutSetting() {
  localStorage.setItem('RetailLayoutSetting', JSON.stringify(retailLayoutSetting))
}

export function loadRetailLayoutSetting() {
  let setting = localStorage.getItem('RetailLayoutSetting')
  if (setting) {
    setting = JSON.parse(setting)
    for(const key of Object.keys(setting)) {
      retailLayoutSetting[key] = setting[key]
    }
  }
}
