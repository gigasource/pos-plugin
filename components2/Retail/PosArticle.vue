<script>
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { genScopeId } from '../utils';
import { articleSelectedProductButton } from './pos-article-logic'

import PosFunctionSortComponent from './Article/PosFunctionSortComponent';
import PosColorSelector from './Article/PosColorSelector';
import PosArticleProductInfo from './Article/PosArticleProductInfo';
import PosArticleProductCategoryMenu from './Article/PosArticleProductCategoryMenu';
import PosArticleScrollWindow from './Article/PosArticleScrollWindow';
import PosArticleNumpad from './Article/PosArticleNumpad';
import PosArticleFunctionButton from './Article/PosArticleFunctionButton';

export default {
  name: 'PosArticle',
  components: {
    PosFunctionSortComponent,
    PosColorSelector,
    PosArticleNumpad,
    PosArticleFunctionButton,
    PosArticleProductInfo,
    PosArticleProductCategoryMenu,
    PosArticleScrollWindow,
  },
  setup() {
    const { t } = useI18n()

    const router = useRouter()
    function goBack() {
      router.go(-1)
    }

    function renderProductInfo() {
      return (
          <pos-article-product-info class="pra__left__product-info"></pos-article-product-info>
      )
    }
    function renderColorSelector() {
      return <>
        <p class="pra__left__color-title pra__left__prop">Color</p>
        <pos-color-selector class="pra__left__color-content"></pos-color-selector>
      </>
    }
    function renderFunctionSort() {
      return <>
        <p class="pra__left__sorting-title pra__left__prop">Sorting</p>
        <pos-function-sort-component class="pra__left__sorting-content"></pos-function-sort-component>
      </>
    }
    function renderToolbar() {
      return (
          <g-toolbar color="#eee" elevation="0" fill-height class="pra__left__button-control">
            <g-btn uppercase={false} background-color="white" class="mr-3" style="margin-left: -4px" onClick={goBack}>
              <g-icon class="mr-2" svg>
                icon-back
              </g-icon>

              {t('ui.back')}
            </g-btn>
          </g-toolbar>
      )
    }
    function renderProductOverlay() {
      if (articleSelectedProductButton.value)
        return

      return (
        <div class="pra__left__layout-left-overlay" style="z-index: 99; background-color: rgba(255, 255, 255, 1); width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;">
          <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
            <g-icon svg size="62" style="margin-bottom: 10px;">icon-info-green</g-icon>
            <p>Please select a button to configure</p>
          </div>
        </div>
      )
    }
    function renderLeft() {
      return (
          <div class="pra__left">
            { renderProductInfo() }
            { renderColorSelector() }
            { renderFunctionSort() }
            { renderToolbar() }
            { renderProductOverlay() }
          </div>
      )
    }
    function renderRight() {
      return (
          <div class="pra__right">
            <pos-article-product-category-menu class="pra__right__menu"></pos-article-product-category-menu>
            <div class="pra__right__menu__overlay"></div>
            <pos-article-scroll-window class="pra__right__main">
              <div class="pra__right__main__window"></div>
              <div class="pra__right__main__delimiter"></div>
            </pos-article-scroll-window>
            <div class="pra__right__main__overlay"></div>
            <div class="pra__right__controller">
              <pos-article-numpad class="pra__right__controller__keyboard"></pos-article-numpad>
              <pos-article-function-button class="pra__right__controller__buttons">
                <div class="pra__right__controller__buttons__big-btn"></div>
              </pos-article-function-button>
              <div class="pra__right__controller__buttons__overlay"></div>
              <div class="pra__right__controller__overlay"></div>
            </div>
            <div class="pra__right__overlay"></div>
          </div>
      )
    }

    return genScopeId(() => (
        <div class="pra">
          { renderLeft() }
          { renderRight() }
        </div>
    ))
  }
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

    &__prop {
      font-family: Muli;
      font-size: 13px;
      font-weight: normal;
      line-height: 16px;
      color: #1D1D26
    }

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
