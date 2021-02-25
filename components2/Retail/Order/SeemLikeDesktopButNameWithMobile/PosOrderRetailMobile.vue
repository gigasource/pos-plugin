<script>
import PosOrderScreenNumberKeyboard from '../PosOrderScreenNumberKeyboard';
import PosOrderScreenButtonGroup from '../PosOrderScreenButtonGroup';
import PosOrderScreenTable from './PosOrderScreenTable';
import PosRetailMobileInfo from './PosRetailMobileInfo';
import PosOrderScreenAction from './PosOrderScreenAction';
import PosOrderScreenReport from './PosOrderScreenReport';
import dialogSavedList from '../../../../components/Order/components/dialogSavedList';
import dialogProductSearchResult from '../../../../components/Order/components/dialogProductSearchResult';
import dialogChangeValue from '../../../pos-shared-components/dialogChangeValue';
import DialogProductLookup from '../../../../components/Order/components/dialogProductLookup';
import { genScopeId } from '../../../utils';

import {
  showDialogSavedList, showDialogProductSearchResult, showDialogChangePrice, showDialogProductLookup,
  updateNewPrice
} from '../temp-logic'

export default {
  name: 'PosOrderRetailMobile',
  components: {
    DialogProductLookup,
    PosOrderScreenNumberKeyboard,
    PosOrderScreenButtonGroup,
    PosOrderScreenTable,
    PosRetailMobileInfo,
    PosOrderScreenAction,
    PosOrderScreenReport,
    dialogSavedList,
    dialogProductSearchResult,
    dialogChangeValue,
  },
  setup() {
    function submitChangePrice(val) {
      updateNewPrice(val)
    }

    return genScopeId(() => <>
      <div class="porm">
        <pos-order-screen-table class="porm__table"></pos-order-screen-table>
        <div class="porm__main-retail">
          <pos-retail-mobile-info class="porm__main-retail__info"></pos-retail-mobile-info>
          <pos-order-screen-report class="porm__main-retail__report"></pos-order-screen-report>
          <pos-order-screen-action class="porm__main-retail__action"></pos-order-screen-action>
          <pos-order-screen-number-keyboard class="porm__main-retail__keyboard"></pos-order-screen-number-keyboard>
          <pos-order-screen-button-group class="porm__main-retail__buttons"></pos-order-screen-button-group>
        </div>
      </div>
      <dialog-saved-list v-model={showDialogSavedList.value}></dialog-saved-list>
      <dialog-product-search-result v-model={showDialogProductSearchResult.value}></dialog-product-search-result>
      <dialog-change-value v-model={showDialogChangePrice.value} new-value-editable="true" onSubmit={submitChangePrice}></dialog-change-value>
      <dialog-product-lookup v-model={showDialogProductLookup.value}></dialog-product-lookup>
    </>)
  }
}
</script>
<style scoped lang="scss">
.porm {
  display: grid;
  grid-template-columns: 50% 50%;
  grid-template-rows: 100%;
  height: 100%;

  &__table {
    grid-area: 1 / 1 / 2 / 2;
  }

  &__main-retail {
    grid-area: 1 / 2 / 2 / 3;
    display: grid;
    grid-template-columns: 50% 50%;
    grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr;

    &__info {
      grid-area: 1 / 1 / 2 / 3;
    }

    &__report {
      grid-area: 2 / 1 / 3 / 3;
    }

    &__action {
      grid-area: 3 / 1 / 4 / 3;
    }

    &__keyboard {
      grid-area: 4 / 1 / 7 / 2;
    }

    &__buttons {
      grid-area: 4 / 2 / 7 / 3;
    }
  }
}
</style>
