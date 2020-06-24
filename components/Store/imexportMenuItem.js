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
    o.mark = o.mark || {}
    o.mark.spicy = { active: isPropTrue(v), notice: '' }
  },
  'vegeterian': (o, v) => {
    o.mark = o.mark || {}
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
  const optionPattern = /\((?<option>[^=]+)=(?<price>\d+(\.\d+)?)\)+/g
  const choices = []
  let match
  while ((match = choicePattern.exec(choiceStr)) != null) {
    let choiceName = match.groups['choice_name']
    let mandatory = match.groups['mandatory']
    let quantity = match.groups['quantity']
    let optionsStr = match.groups['options']
    const options = []
    let optionMatch
    while ((optionMatch = optionPattern.exec(optionsStr)) != null) {
      options.push({
        name: optionMatch.groups['option'],
        price: Number(optionMatch.groups['price'])
      })
    }

    choices.push({
      name: choiceName.toUpperCase(),
      mandatory: mandatory === '*',
      select: quantity === '1' ? 'one' : 'many',
      options: options
    })
  }
  return choices
}

/**
 * Convert workbook to plain javascript object array
 * Each worksheet will be converted to Category object with props
 *  + name: worksheet name
 *  + position: order of worksheet
 *  + items: worksheet rows -> items
 * @param workbook
 * @returns {Array}
 */
function workbook2PJSO(workbook) {
  // SheetName startwith : is document sheet
  // This sheet will be ignored
  const dataSheetNames = _.filter(workbook.SheetNames, sheetName => !_.startsWith(sheetName, '@'))
  return _.map(dataSheetNames, (sheetName, index) => ({
    name: sheetName,
    position: index,
    items: getItemsInCategory(workbook.Sheets[sheetName])
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
        const colName = sheet[XLSX.utils.encode_cell({ r: 0, c: colNum })].w;
        // https://www.npmjs.com/package/xlsx#cell-object
        mappingFns[colName] && mappingFns[colName](item, nextCell.w)
      }
    }
    // remove invalid item
    if (isItemValid(item)) {
      result.push(item);
    }
  }
  return result;
}

/**
 * Insert menu item to database
 * @param categories
 * @param storeId
 * @param behavior
 * @returns {Promise<void>}
 */
async function insertProductCategoriesToDatabase(categories, storeId, behavior) {
  let currentCateInStore = 0

  switch (behavior) {
    case 'wipeOutOldData':
      await cms.getModel(CATEGORY_COLLECTION).remove({ store: storeId })
      await cms.getModel(PRODUCT_COLLECTION).remove({ store: storeId })
      break;
    case 'append':
    case 'upsert':
      currentCateInStore = await cms.getModel(CATEGORY_COLLECTION).countDocuments({ store: storeId })
      break;
      // more behavior
    default:
      break;
  }

  const insertTasks = _.map(categories, async category => {
    try {
      // find category, if category is not exist then create it
      // else if behavior is update then update it's position
      let createdCategory = await cms.getModel(CATEGORY_COLLECTION).findOne({ name: category.name, store: storeId })
      if (!createdCategory) {
        createdCategory = await cms.getModel(CATEGORY_COLLECTION).create({
          name: category.name,
          position: category.position + currentCateInStore,
          store: storeId,
        })
      } else if (behavior === 'update') {
        await cms.getModel(CATEGORY_COLLECTION).updateOne({ _id: createdCategory._id }, { position: category.position })
      }

      let currentProductInCates = 0
      switch (behavior) {
        case 'append':
          currentProductInCates = await cms.getModel(PRODUCT_COLLECTION).countDocuments({ category: createdCategory._id })
          break;
          // more behavior
        default:
          break;
      }

      const products = _.map(category.items, (item, index) => ({
        ...item,
        category: createdCategory._id,
        store: storeId,
        position: currentProductInCates + index,
        showImage: true,
        available: true,
      }))

      switch (behavior) {
        case 'upsert':
          // assume that there is no duplicate product name in the same category
          // product property will be update base on it's name
          // if product's name is change, this product will be considered as new product
          // after this import, both old and new version of this product exists in database. you must remove it manually/
          const productNames = _.map(products, p => p.name)
          // find existed products in current category
          const filter = {
            name: { $in: productNames },
            store: storeId,
            category: createdCategory._id
          }
          const projection = { _id: 1, name: 1 }
          const existedProducts = await cms.getModel(PRODUCT_COLLECTION).find(filter, projection)
          const existedProductNames = _.map(existedProducts, ep => ep.name)
          // separated date into 2 chunks: update chunks and insert chunks
          const productsWillBeUpdated = _.filter(products, p => existedProductNames.includes(p.name))
          const productsWillBeInserted = _.filter(products, p => !existedProductNames.includes(p.name))
          // build { name: id } map from returned result
          const existedProductsIdNameMap = _.reduce(existedProducts, (acc, v) => {
            acc[v.name] = v._id;
            return acc
          }, {})
          const bulkUpdateData = _.map(productsWillBeUpdated, up => ({
            updateOne: { filter: { _id: existedProductsIdNameMap[up.name] }, update: up, upsert: false }
          }))

          try {
            if (bulkUpdateData.length)
              await cms.getModel(PRODUCT_COLLECTION).bulkWrite(bulkUpdateData)
          } catch (e) {
            console.error('update existed product', e)
          }
          // get total current product in current category
          // change position of inserted product
          currentProductInCates = await cms.getModel(PRODUCT_COLLECTION).countDocuments({ category: createdCategory._id })
          _.each(productsWillBeInserted, p => p.position = currentProductInCates++)
          try {
            await cms.getModel(PRODUCT_COLLECTION).insertMany(productsWillBeInserted)
          } catch (e) {
            console.error('insert new product', e)
          }
          break;
        default: // append, wipeOutOldData
          await cms.getModel(PRODUCT_COLLECTION).insertMany(products);
          break;
      }
    } catch (e) {
      console.log('error', e)
    }
  })

  await Promise.all(insertTasks)
}

/**
 * Read product menu item from xlsx file then insert it into database
 * @param workbook
 * @param storeId
 * @param onCompleted
 * @param behavior
 * @returns {Promise<void>}
 */
export async function imexportMenuItem({ workbook, storeId, onCompleted, behavior }) {
  try {
    const productCategories = workbook2PJSO(workbook)
    await insertProductCategoriesToDatabase(productCategories, storeId, behavior)
    onCompleted && onCompleted(true)
  } catch (e) {
    onCompleted && onCompleted(false, e)
  }
}


// ---- export ----------------------------
function toChoicesStr(choices) {
  if (!choices || choices.length === 0) {
    return ''
  }
  return _.map(choices, c => `${c.name}${c.mandatory ? '*' : ''}${c.select === 'one' ? 1 : 2}:${_.map(c.options, opt => `(${opt.name}=${opt.price})`).join('')}`).join(';') + ';'
}

const invertAllergicMaps = _.invert(allergicMaps)

function toAllergicStr(allergic) {
  if (!allergic || !allergic.active) {
    return undefined
  }
  return _.map(allergic.types, type => invertAllergicMaps[type]).join(',')
}

function productDataHeaderRow() {
  return ['id', 'name', 'desc', 'price', 'printer', 'tax', 'choices', 'spicy', 'vegeterian', 'allergic']
}

function productToXLSXDataRow(p) {
  const groupPrinters = (p.groupPrinters || []).join(',')
  const choices = toChoicesStr(p.choices)
  const spicy = p.mark && p.mark.spicy && p.mark.spicy.active ? '1' : undefined
  const vegeterian = p.mark && p.mark.vegeterian && p.mark.vegeterian.active ? '1' : undefined
  const allergic = toAllergicStr(p.mark && p.mark.allergic)
  return [p.id, p.name, p.desc, p.price, groupPrinters, p.tax, choices, spicy, vegeterian, allergic]
}

export async function exportMenuItem({ storeId }) {
  const wb = XLSX.utils.book_new();
  const categories = await cms.getModel(CATEGORY_COLLECTION).find({ store: storeId })
  const products = await cms.getModel(PRODUCT_COLLECTION).find({ store: storeId })
  console.log(products)
  _.each(categories, c => {
    const data = [
      // header
      productDataHeaderRow(),
      // data
      ..._.map(_.filter(products, p => p.category._id === c._id), productToXLSXDataRow)
    ]
    console.log('-----')
    console.log(data)
    console.log(c.name, c._id)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), c.name);
  })

  XLSX.writeFile(wb, 'out.xlsx')
}

export default {
  importMenuItem: imexportMenuItem,
  exportMenuItem
}
