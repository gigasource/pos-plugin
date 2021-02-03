import { ref } from 'vue'
import { getProductGridOrder } from '../../components/logic/productUtils';
export const categories = ref([])
export const activeCategory = ref(null)
export const activeCategoryProducts = ref(null)
export const articleSelectedProductButton = ref(null)
export const articleSelectedColor = ref(null)


function getProductLayout(item, category) {
  const isFavourite = category && category.name === 'Favourite' || false
  return item.layouts && item.layouts.find(layout => !!layout.favourite === isFavourite) || {}
}

export async function loadAllCategories() {
  const _categories = await cms.getModel('Category').find().sort('position')
  const posSettings = (await cms.getModel('PosSetting').find())[0]; // TODO: Using posSetting in app-shared-state
  let favoriteArticle = posSettings.generalSetting.favoriteArticle;
  categories.value = favoriteArticle ? _categories : _categories.filter(cat => cat.name !== 'Favourite').map(c => ({
    ...c,
    position: c.position
  }))
}
export async function getActiveProducts() {
  if (!activeCategory.value) {
    activeCategoryProducts.value = []
    return
  }

  let products
  if (activeCategory.value.name === 'Favourite') {
    products = await cms.getModel('Product').find({'option.favorite': true})
  } else {
    products = await cms.getModel('Product').find({'category': activeCategory.value._id})
  }
  activeCategoryProducts.value = products.sort((current, next) => getProductGridOrder(current) - getProductGridOrder(next))
}

export async function updateArticleOrders() {
  const productModel = cms.getModel('Product');
  try {
    await Promise.all(activeCategoryProducts.value.map(async (article, index) => {
      const articleLayout = getProductLayout(article, activeCategory.value)
      if (articleLayout.order !== index + 1) {
        await productModel.findOneAndUpdate({'layouts._id': articleLayout._id}, {
          '$set': {
            'layouts.$.order': index + 1
          }
        });
        return articleLayout.order = index + 1;
      }
      return articleLayout.order;
    }))
  } catch (e) {
    console.error('Error reordering articles: ', e);
  }
}

export async function selectArticle(item) {
  if (articleSelectedProductButton.value && item._id === articleSelectedProductButton.value._id) {
    articleSelectedProductButton.value = null;
    articleSelectedColor.value = null;
    return;
  }
  articleSelectedProductButton.value = item;
  const layout = getProductLayout(articleSelectedProductButton.value, activeCategory.value);
  articleSelectedColor.value = layout && layout.color;
}

export async function switchProductOrder(direction, category) {
  const selectedArticleLayout = getProductLayout(articleSelectedProductButton.value, category)

  if (!articleSelectedProductButton.value || !direction) {
    return;
  }

  let dir = direction === 'right' ? 1 : -1;

  const foundItem = activeCategoryProducts.value.find((item) => item._id === articleSelectedProductButton.value._id);
  if (foundItem) {
    const foundNextItem = activeCategoryProducts.value.find(item => {
      const layout = getProductLayout(item, category)
      return layout && layout.order && (layout.order === selectedArticleLayout.order + dir)
    })

    if (foundNextItem) {
      //Update order on current product list
      const nextItemLayout = getProductLayout(foundNextItem, category)
      const currentItemLayout = getProductLayout(foundItem, category)

      //Update db order
      const productModel = cms.getModel('Product')
      try {
        let currentItemResult = await productModel.findOneAndUpdate({'layouts._id': currentItemLayout._id}, {
          '$set': {
            'layouts.$.order': nextItemLayout.order
          }
        });

        let nextItemResult = await productModel.findOneAndUpdate({'layouts._id': nextItemLayout._id}, {
          '$set': {
            'layouts.$.order': currentItemLayout.order
          }
        });

        if (nextItemResult && currentItemResult) {
          const temp = nextItemLayout.order
          nextItemLayout.order = currentItemLayout.order;
          currentItemLayout.order = temp;
        }
      } catch (e) {
        console.error(e);
      }

      activeCategoryProducts.value = activeCategoryProducts.value.sort((current, next) =>
          getProductGridOrder(current) - getProductGridOrder(next))
    }
  }
}

export async function setSelectedArticleColor() {
  if (!articleSelectedColor.value || !articleSelectedProductButton.value) {
    return
  }

  //Update to db
  const productModel = cms.getModel('Product')
  const layout = getProductLayout(articleSelectedProductButton.value, activeCategory.value)
  const layoutID = layout._id
  //Update current product
  let foundItem = activeCategoryProducts.value.find((item) => item._id === articleSelectedProductButton.value._id);
  if (foundItem) {
    try {
      let updateColorResult = await productModel.findOneAndUpdate({'layouts._id': layoutID}, {
        '$set': {
          'layouts.$.color': articleSelectedColor.value
        }
      });

      if (updateColorResult) {
        layout.color = articleSelectedColor.value;
      }
    } catch (e) {
      console.error(e)
    }
  }
}
