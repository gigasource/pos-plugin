import {onActivated, reactive, ref} from "vue";

export const fontSize = ref('14px');
export const category = reactive({
  type: 'horizontal', size: '64px', singleRow: false,
  differentSize: false, fontSize: '13px'
});
export const minimumTextRow = ref(true);
export const collapseBlankColumn = ref(true);
export const collapseText = ref(true);
export const showOverlay = ref(true);
export const showSplitBtn = ref(true);
export const smallSidebar = ref(true);
export const scrollableLayout = ref(true);
export const editModeOL = ref(false);
export const hideTextRow = ref(false);
export const hideBlankColumn = ref(false);

const olSetting = reactive({
  fontSize, category, minimumTextRow, collapseBlankColumn,
  collapseText, showOverlay, showSplitBtn, smallSidebar, scrollableLayout,
  hideTextRow, hideBlankColumn
})

export function saveOrderLayoutSetting() {
  const setting = {
    fontSize, category, minimumTextRow, collapseBlankColumn,
    collapseText, showOverlay, showSplitBtn, smallSidebar, scrollableLayout,
    hideTextRow, hideBlankColumn
  }
  localStorage.setItem('OrderScreenSetting', JSON.stringify(setting))
}

export function loadOrderLayoutSetting() {
  let setting = localStorage.getItem('OrderScreenSetting')
  if (setting) {
    setting = JSON.parse(setting);
    Object.keys(olSetting)
    for (const key of Object.keys(olSetting)) {
      if (key === 'category') {
        Object.assign(category, setting[key]);
        continue
      }
      olSetting[key] = setting[key];
    }
  }
}

loadOrderLayoutSetting();

export function autoLoadOrderLayoutSetting() {
  onActivated(() => {
    loadOrderLayoutSetting();
  })
}

export function changeSize(num) {
  const size = +fontSize.value.slice(0, fontSize.value.length - 2)
  if (size + num > 0) {
    fontSize.value = `${size + num}px`
  }
}

export function changeCategory() {
  category.type = category.type === 'horizontal' ? 'vertical' : 'horizontal';
}

export function changeCategorySize(change) {
  const size = +category.size.slice(0, category.size.length - 2)
  if (size + change > 0) {
    Object.assign(category, {size: `${size + change}px`})
  }
}

export function changeCategoryFontSize(change) {
  const size = +category.fontSize.slice(0, category.fontSize.length - 2)
  if (size + change > 0) {
    category.fontSize = `${size + change}px`;
  }
}

export function changeCategoryStyle(key, value) {
  let change = {}
  change[key] = value
  Object.assign(category, change);
}
