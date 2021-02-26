<script>
  import _ from 'lodash'
  import { activeCategory, articleSelectedProductButton } from './pos-article-logic';
  import { computed } from 'vue'
  import { genScopeId } from '../../utils';
  import { useI18n } from 'vue-i18n'

  export default {
    name: 'PosArticleProductInfo',
    setup() {
      const { t } = useI18n()

      const productAttributes = computed(() => {
        return articleSelectedProductButton.value && articleSelectedProductButton.value.attributes
            ? mergeAttributes(articleSelectedProductButton.value.attributes)
            : [];
      })

      function mergeAttributes(attributes) {
        return _.map(_.groupBy(attributes, 'key'),
              val => ({
                key: val[0].key,
                values: val.map(v => v.value).join(', ')
              }))
      }

      function renderContentLeft() {
        if (!articleSelectedProductButton.value)
          return

        return (
            <div class="product-content-left">
              <div>
                <p style="font-size: 15px; line-height: 19px">{articleSelectedProductButton.value.name}</p>
                <p class="product-info">#{articleSelectedProductButton.value.id}</p>
              </div>
              <div style="display: block; margin-top: 5px;">
                <p class="sub-title">{t('article.unit')} </p>
                {
                  articleSelectedProductButton.value.unit && <p class="product-info">{articleSelectedProductButton.value.unit}</p>
                }
              </div>
              <div style="margin-top: 5px;">
                <p class="sub-title">{t('article.price')} </p>
                {
                  (articleSelectedProductButton.value.price) && <p class="product-info">€ {articleSelectedProductButton.value.price}</p>
                }
              </div>
            </div>
        )
      }

      function renderContentRight() {
        return (
            <div class="product-content-right">
              <div>
                <p class="sub-title">{t('article.barcode')} </p>
                {
                  (articleSelectedProductButton.value && articleSelectedProductButton.value.barcode) &&
                  <p class="product-info">{articleSelectedProductButton.value.barcode}</p>
                }
              </div>
              <div style="margin-top: 5px;">
                <span class="sub-title">{t('article.attributes')}</span>
                <div>
                  {productAttributes.value.map(item =>
                      <div class="product-info">
                        <span class="product-info">{item.key}:</span>
                        <span class="product-info">{item.values}</span>
                      </div>
                  )}
                </div>
              </div>
            </div>
        )
      }


      return genScopeId(() => (
          <div class="article-wrapper" style="height: 226px">
            <p class="category-title" style>{t('article.category')}</p>
            { (activeCategory.value && activeCategory.value.name) && <p class="category-content">{activeCategory.value.name}</p> }
            <p class="product-title">{t('article.product')}</p>
            { renderContentLeft() }
            { renderContentRight() }
          </div>
      ))
    },
  }
</script>

<style lang="scss" scoped>
  .product-info {
    font-size: 14px;
    line-height: 18px;
    text-transform: capitalize;
  }

  .sub-title {
    font-size: 13px;
    opacity: 0.5;
  }

  .article-wrapper {
    display: grid;
    grid-template-rows: 30% 70%;
    grid-template-columns: 16% 1fr 1fr;
    height: 100%
  }

  .product-content-left {
    grid-column: 2 /3;
    grid-row: 2 / 3;
    padding: 12px 28px 45px 5px;
    width: 100%;
    height: 100%
  }

  .product-content-right {
    grid-column: 3 / 4;
    grid-row: 2 / 3;
    padding: 12px 28px 45px 17px;
    width: 100%;
    height: 100%
  }

  .product-title {
    padding: 12px 9px 23px 17px;
    grid-row: 2 / 3;
    grid-column: 1 / 2;
    font-family: 'Muli', serif;
    font-size: 13px;
    font-weight: normal;
    line-height: 16px;
    color: #1D1D26;
  }

  .category-title {
    grid-row: 1 / 2;
    grid-column: 1 / 2;
    font-family: 'Muli', serif;
    padding: 23px 9px 23px 17px;
    font-size: 13px;
    font-weight: normal;
    line-height: 16px;
    color: #1D1D26;
  }

  .category-content {
    grid-row: 1 / 2;
    grid-column: 2 / 4;
    font-family: 'Muli', serif;
    font-size: 14px;
    font-weight: bold;
    line-height: 18px;
    padding: 23px 8px 17px 5px;
  }
</style>
