<template>
  <div class="pra">
    <div class="pra__layout__left">
      <p class="pra__layout__left__sorting-title"
         style="font-family: Muli; font-size: 13px; font-weight: normal; line-height: 16px; color: #1D1D26">
        Sorting
      </p>
      <pos-function-sort-component class="pra__layout__left__sorting-content"/>
      <p class="pra__layout__left__color-title"
         style="font-family: Muli; font-size: 13px; font-weight: normal; line-height: 16px; color: #1D1D26">
        Color
      </p>
      <pos-color-selector class="pra__layout__left__color-content"/>
      <pos-function-toolbar class="pra__layout__left__button-control"/>
      <pos-article-product-info class="pra__layout__left__product-info"/>
      <pos-article-layout-overlay class="pra__layout__left__layout-left-overlay"/>
    </div>
    <div class="pra__layout__right">
      <pos-article-product-category-menu class="pra__layout__right__menu"/>
      <div class="pra__layout__right__menu__overlay"></div>
      <pos-article-scroll-window class="pra__layout__right__main">
        <div class="pra__layout__right__main__window"></div>
        <div class="pra__layout__right__main__delimiter"></div>
      </pos-article-scroll-window>
      <div class="pra__layout__right__main__overlay"></div>
      <div class="pra__layout__right__controller">
        <pos-article-numpad class="pra__layout__right__controller__keyboard"
                            style="padding: 5px 0 5px 5px"
        ></pos-article-numpad>
        <pos-article-function-button class="pra__layout__right__controller__buttons"
                                     style="padding: 5px  5px 5px 0">
          <div class="pra__layout__right__controller__buttons__big-btn"></div>
          <div class="pra__layout__right__controller__buttons__overlay"></div>
          <div class="pra__layout__right__controller__controller__overlay"
               style="background-color: rgba(255, 255, 255, 0.54); z-index: 99"
          ></div>
        </pos-article-function-button>
      </div>
      <div class="pra__layout__right__controller__overlay"
           style="box-shadow: 0 0 8px rgba(0, 0, 0, 0.25)"
      ></div>
    </div>
  </div>
</template>
<script>
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
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 100%;

  &__layout__left {
    grid-area: 1/1/2/2;
    display: grid;
    grid-template-columns: 16% 1fr 1fr;
    grid-template-rows: minmax(8%, 1fr) 1fr minmax(18%, 1fr) minmax(170px, 1fr) 1fr 64px;
    &__sorting-title {
      grid-area: 1/4/2/5;
    }
    &__sorting-content {
      grid-area: 2/4/4/5;
    }
    &__color-title {
      grid-area: 1/3/2/4;
    }
    &__color-content {
      grid-area: 2/3/4/4;
    }
    &__button-control {
      grid-area: 1/6/4/7;
    }
    &__product-info {
      grid-area: 1/1/4/3;
    }
    &__layout-left-overlay {
      grid-area: 1/1/4/6;
    }
  }

  &__layout__right {
    grid-area: 2/1/3/2;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 12% 1fr 1fr;

    &__menu {
      grid-area: 1/1/2/2;
    }

    &__menu__overlay {
      grid-area: 1/1/2/2;
    }

    &__main {
      grid-area: 1/2/2/3;
      display: grid;
      grid-template-columns: 100%;
      grid-template-rows: 1fr 12px;

      &__window {
        grid-area: 1/1/2/2;
      }

      &__delimiter {
        grid-area: 1/2/2/3;
      }

    }

    &__main__overlay {
      grid-area: 1/2/2/3;
    }

    &__controller {
      grid-area: 1/3/2/4;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr;

      &__keyboard {
        grid-area: 1/1/2/2;
      }

      &__buttons {
        grid-area: 2/1/3/2;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr;

        &__btn-big {
          grid-area: 1/5/2/7;
        }
      }

      &__buttons__overlay {
        grid-area: 2/1/3/2;
      }

      &__controller__overlay {
        grid-area: 1/1/3/2;
      }
    }
  }

  &__layout__right__overlay {
    grid-area: 2/1/3/2;
  }
 }
</style>
