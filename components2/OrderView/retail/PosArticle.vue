<template>
  <div class="pra">
    <div class="pra__left">
      <pos-article-product-info class="pra__left__product-info"/>
      <!--color selector-->
      <p class="pra__left__color-title"
         style="font-family: Muli; font-size: 13px; font-weight: normal; line-height: 16px; color: #1D1D26">
        Color
      </p>
      <pos-color-selector class="pra__left__color-content"/>
      <!-- function sort -->
      <p class="pra__left__sorting-title"
         style="font-family: Muli; font-size: 13px; font-weight: normal; line-height: 16px; color: #1D1D26">
        Sorting
      </p>
      <pos-function-sort-component class="pra__left__sorting-content"/>
      <pos-function-toolbar class="pra__left__button-control"/>
      <pos-article-layout-overlay class="pra__left__layout-left-overlay"/>
    </div>
    <div class="pra__right">
      <pos-article-product-category-menu class="pra__right__menu"/>
      <div class="pra__right__menu__overlay"></div>
      <pos-article-scroll-window class="pra__right__main">
        <div class="pra__right__main__window"></div>
        <div class="pra__right__main__delimiter"></div>
      </pos-article-scroll-window>
      <div class="pra__right__main__overlay"></div>
      <div class="pra__right__controller">
        <pos-article-numpad class="pra__right__controller__keyboard"/>
        <pos-article-function-button class="pra__right__controller__buttons">
          <div class="pra__right__controller__buttons__big-btn"></div>
        </pos-article-function-button>
        <div class="pra__right__controller__buttons__overlay"></div>
        <div class="pra__right__controller__overlay"></div>
      </div>
      <div class="pra__right__overlay"></div>
    </div>
  </div>
</template>
<script>
import PosFunctionSortComponent from '../../../components/Article/PosFunctionSortComponent';
import PosFunctionToolbar from '../../../components/Article/PosFunctionToolbar';
import PosColorSelector from '../../../components/Article/PosColorSelector';
import PosArticleProductInfo from '../../../components/Article/PosArticleProductInfo';
import PosArticleProductCategoryMenu from '../../../components/Article/PosArticleProductCategoryMenu';
import PosArticleScrollWindow from '../../../components/Article/PosArticleScrollWindow';
import PosArticleLayoutOverlay from '../../../components/Article/PosArticleLayoutOverlay';
import PosArticleNumpad from '../../../components/Article/PosArticleNumpad';
import PosArticleFunctionButton from '../../../components/Article/PosArticleFunctionButton';

export default {
  name: 'PosArticle',
  props: {},
  components: {
    PosFunctionSortComponent,
    PosFunctionToolbar,
    PosColorSelector,
    PosArticleNumpad,
    PosArticleFunctionButton,
    PosArticleProductInfo,
    PosArticleProductCategoryMenu,
    PosArticleScrollWindow,
    PosArticleLayoutOverlay
  },
  data: function () {
    return {}
  },
  computed: {},
  methods: {}
}
</script>
<style scoped lang="scss">
.pra {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 100%;
  &__left {
    grid-area: 1/1/2/2;
    display: grid;
    grid-template-columns: 16% 1fr 1fr;
    grid-template-rows: minmax(8%, 1fr) 1fr minmax(18%, 1fr) minmax(170px, 1fr) 1fr 64px;
    &__sorting-title {
      grid-area: 4/1/5/2;
    }
    &__sorting-content {
      grid-area: 4/2/5/4;
    }
    &__color-title {
      grid-area: 3/1/4/2;
    }
    &__color-content {
      grid-area: 3/2/4/4;
    }
    &__button-control {
      grid-area: 6/1/7/4;
    }
    &__product-info {
      grid-area: 1/1/3/4;
    }
    &__layout-left-overlay {
      grid-area: 1/1/6/4;
    }
  }
  &__right {
    grid-area: 1/2/2/3;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 12% 1fr 1fr;
    &__menu {
      grid-area: 1/1/2/2;
      &__overlay {
        grid-area: 1/1/2/2;
      }
    }
    &__main {
      grid-area: 2/1/3/2;
      display: grid;
      grid-template-columns: 100%;
      grid-template-rows: 1fr 12px;
      &__window {
        grid-area: 1/1/2/2;
      }
      &__delimiter {
        grid-area: 2/1/3/2;
      }
      &__overlay {
        grid-area: 2/1/3/2;
      }
    }
    &__controller {
      grid-area: 3/1/4/2;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr;

      &__keyboard {
        grid-area: 1/1/2/2;
        padding: 5px 0 5px 5px;
      }
      &__buttons {
        grid-area: 1/2/2/3;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr;
        padding: 5px  5px 5px 0;

        &__btn-big {
          grid-area: 5/1/7/2;
        }
      }
      &__buttons__overlay {
        grid-area: 1/2/2/3;
      }
      &__overlay {
        grid-area: 1/1/2/3;
        background-color: rgba(255, 255, 255, 0.54); z-index: 99
      }
    }
    &__overlay {
      grid-area: 1/1/4/2;
    }
  }
 }
</style>
