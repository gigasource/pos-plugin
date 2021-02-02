<template>
  <div class="article-wrapper" style="height: 226px">
    <p class="category-title" style="">{{ $t('article.category') }}</p>
    <p class="category-content" v-if="activeCategory && activeCategory.name">{{ activeCategory.name }}</p>
    <p class="product-title">{{$t('article.product')}}</p>

    <div class="product-content-left" v-if="articleSelectedProductButton">
      <div>
        <p style="font-size: 15px; line-height: 19px">{{ articleSelectedProductButton.name }}</p>
        <p class="product-info">#{{articleSelectedProductButton.id }}</p>
      </div>
      <div style="display: block; margin-top: 5px;">
        <p class="sub-title">{{$t('article.unit')}} </p>
        <p class="product-info" v-if="articleSelectedProductButton && articleSelectedProductButton.unit">{{ articleSelectedProductButton.unit }}</p>
      </div>
      <div style="margin-top: 5px;">
        <p class="sub-title">{{$t('article.price')}} </p>
        <p class="product-info" v-if="articleSelectedProductButton && articleSelectedProductButton.price">€ {{ articleSelectedProductButton.price }}</p>
      </div>
    </div>
    <div class="product-content-right">
      <div>
        <p class="sub-title">{{$t('article.barcode')}} </p>
        <p class="product-info" v-if="articleSelectedProductButton && articleSelectedProductButton.barcode">{{ articleSelectedProductButton.barcode }}</p>
      </div>
      <div style="margin-top: 5px;">
        <span class="sub-title">{{$t('article.attributes')}}</span>
        <div v-if="productAttributes">
          <div class="product-info" v-for="item in productAttributes">
            <span class="product-info">{{item.key}}: </span>
            <span class="product-info">{{item.values}}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: 'PosArticleProductInfo',
    injectService: ['SettingsStore:(activeCategory, articleSelectedProductButton)'],
    methods: {
      mergeAttributes(attributes) {
        return _.map(_.groupBy(attributes, 'key'),
          val => ({
            key: val[0].key,
            values: val.map(v => v.value).join(', ')
          })
        )
      }
    },
    computed: {
      productAttributes() {
        return !this.articleSelectedProductButton || !this.articleSelectedProductButton.attributes
          ? []
          : this.mergeAttributes(this.articleSelectedProductButton.attributes);
      }
    }
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
