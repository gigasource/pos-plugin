// import product
// return cateogry object
import _ from 'lodash';
import XLSX from 'xlsx';

const CATEGORY_COLLECTION = 'Category'
const PRODUCT_COLLECTION = 'Product'
const allergicMaps = {
  'eg': 'eggs',
  'mi': 'milk',
  'gl': 'cereal', //Cereals containing gluten
  'pe': 'peanuts',
  'lu': 'lupin',
  'cr': 'crustaceans',
  'mo': 'molluscs',
  'mu': 'mustard',
  'fi': 'fish',
  'ce': 'celery',
  'nu': 'nuts',
  'se': 'sesame',
  'so': 'soya',
  'su': 'sulphur'
}
const directMapping = (key, convert) => (obj, value) => obj[key] = (convert && convert(value)) || value
const mappingFns = {
  'id': directMapping('id'),
  'name': directMapping('name'),
  'desc': directMapping('desc'),
  'price': directMapping('price', Number),
  'printer': (o, v) => o.groupPrinters = (v && _.split(v, ',') || []),
  'tax': directMapping('tax', Number),
  'choices': (o, v) => !_.isEmpty(_.trim(v)) && (o.choices = getChoices(v)),
  'allergic': (o, v) => {
    o.mark = o.mark || {}
    const active = !!v
    o.mark.allergic = {
      active,
      notice: '',
      types: active ? _.split(v, ',').map(al => allergicMaps[_.trim(al)]) : []
    }
  },
  'spicy': (o, v) => {
    o.mark = o.mark || { }
    o.mark.spicy = { active: isPropTrue(v), notice: '' }
  },
  'vegeterian': (o, v) => {
    o.mark = o.mark || { }
    o.mark.vegeterian = { active: isPropTrue(v), notice: '' }
  },
}

/**
 * Check if required fields are provided
 * If not then return false
 * @param item
 * @returns {boolean}
 */
function isItemValid(item) {
  return (
         item.name != null
      || item.price != null
      || item.tax != null
  )
}

/**
 * Multiple true value to prevent fault tolerant
 * @param item
 * @returns {boolean}
 */
function isPropTrue(prop) {
  return prop === '1' || prop === 'true' || prop === 'yes'
}

function getChoices(choiceStr) {
  // size*1:(small=5)(medium=10);size*2:(small=5)(medium=10);
  // size*2:(small=5)(medium=10);
  // choice name: size
  // * : mandatory
  // 1 : select one
  // (small=5):  option small, value 5
  // ; : separator or terminate character
  const choicePattern = /(?<choice>(?<choice_name>(\w| )+)(?<mandatory>\*?)(?<quantity>[1|2]):(?<options>[^;]+)+)/g
  // (small=5)(medium=10)
  const optionPattern = /(?<option>[\w| |\.|ä|ö|ü|Ä|Ö|Ü|ß]+)=(?<price>\d+(\.\d+)?)\)+/g
  const choices = []
  let match
  while((match = choicePattern.exec(choiceStr)) != null) {
    let choiceName = match.groups['choice_name']
    let mandatory = match.groups['mandatory']
    let quantity = match.groups['quantity']
    let optionsStr = match.groups['options']
    const options = []
    let optionMatch
    while((optionMatch = optionPattern.exec(optionsStr)) != null) {
      options.push({
        name: optionMatch.groups['option'],
        price: Number(optionMatch.groups['price'])
      })
    }

    choices.push({
      name: choiceName.toUpperCase(),
      mandatory: mandatory === '*',
      select: quantity === '1' ? 'one':'many',
      options: options
    })
  }
  return choices
}

/**
 * Convert workbox to plain javascript object array
 * Each worksheet will be converted to Category object with props
 *  + name: worksheet name
 *  + position: order of worksheet
 *  + items: worksheet rows -> items
 * @param workbox
 * @returns {Array}
 */
function workbox2PJSO(workbox) {
  // SheetName startwith : is document sheet
  // This sheet will be ignored
  const dataSheetNames = _.filter(workbox.SheetNames, sheetName => !_.startsWith(sheetName, '@'))
  return _.map(dataSheetNames, (sheetName, index) => ({
    name: sheetName,
    position: index,
    items: getItemsInCategory(workbox.Sheets[sheetName])
  }))
}

/**
 * Convert sheet rows -> product menu item
 * @param sheet
 * @returns {[]}
 */
function getItemsInCategory(sheet) {
  const result = [];
  let rowNum;
  let colNum;
  // NOTE: range start: index base 0, not start from 1 as excel
  const range = XLSX.utils.decode_range(sheet['!ref']);
  // skip header at index 0
  const startRange = 1
  for (rowNum = startRange; rowNum <= range.e.r; rowNum++) {
    const item = {}
    for (colNum = range.s.c; colNum <= range.e.c; colNum++) {
      const nextCell = sheet[XLSX.utils.encode_cell({ r: rowNum, c: colNum })];
      if (typeof nextCell !== 'undefined') {
        const colName =  sheet[XLSX.utils.encode_cell({ r: 0, c: colNum })].w;
        // https://www.npmjs.com/package/xlsx#cell-object
        mappingFns[colName] && mappingFns[colName](item, nextCell.w)
      }
    }
    // remove invalid item
    if (isItemValid(item))
      result.push(item);
  }
  return result;
}

/**
 * Insert menu item to database
 * @param categories
 * @returns {Promise<void>}
 */
async function insertProductCategoriesToDatabase(categories, storeId) {
  const insertTasks = _.map(categories, async category => {
    try {
      let createdCategory = await cms.getModel(CATEGORY_COLLECTION).findOne({ name: category.name, store: storeId })
      if (!createdCategory) {
        createdCategory = await cms.getModel(CATEGORY_COLLECTION).create({
          name: category.name,
          position: category.position,
          store: storeId,
        })
      }
      const products = _.map(category.items, (item, index) => ({
        ...item,
        category: createdCategory._id,
        store: storeId,
        position: index,
        showImage: false
      }))
      await cms.getModel(PRODUCT_COLLECTION).insertMany(products);
    } catch (e) {
      console.log("error", e)
    }
  })

  await Promise.all(insertTasks)
}

/**
 * Read product menu item from xlsx file then insert it into database
 * @param workbox
 * @returns {Promise<void>}
 */
async function importMenuItem(workbox, storeId, onCompleted) {
  try {
    const productCategories = workbox2PJSO(workbox)
    await insertProductCategoriesToDatabase(productCategories, storeId)
    onCompleted && onCompleted()
  } catch (e) {
    console.warn(e)
  }
}

export default importMenuItem
