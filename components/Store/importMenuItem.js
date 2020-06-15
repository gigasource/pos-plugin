// import product
// return cateogry object
import _ from 'lodash';
import XLSX from 'xlsx';

const colMappings = ['id', 'name', 'desc', 'price', 'printer', 'tax', 'spicy', 'vegeterian']
const CATEGORY_COLLECTION = 'Category'
const PRODUCT_COLLECTION = 'Product'

/**
 * Get header of items from index
 * Consider: Read header from spreadsheet then mapping to property in our db
 * @param colIndex
 * @returns {string}
 */
function getColumnName(colIndex) {
  return colMappings[colIndex]
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
  return _.map(workbox.SheetNames, (sheetName, index) => ({
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
        // https://www.npmjs.com/package/xlsx#cell-object
        item[getColumnName(colNum)] = nextCell.w
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
        category: createdCategory._id,
        store: storeId,
        position: index,
        ..._.pick(item, ['name', 'id']),
        price: Number(item.price || 0),
        tax: Number(item.tax || 0),
        showImage: false,
        groupPrinters: (item.printer && _.split(item.printer, ',')) || [],
        mark: {
          allergic: { types: [] },
          spicy: { active: isPropTrue(item.spicy), notice: '' },
          vegeterian: { acitive: isPropTrue(item.vegeterian), notice: '' }
        }
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
    window.e = e
    debugger
  }
}

export default importMenuItem
