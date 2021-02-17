<script>
  import { nextTick } from 'vue';
  import { genScopeId } from '../../utils';
  import {
    productIdQuery,
    queryProductsById,
    productIdQueryResults,
    addProductToOrder,

    showDialogProductSearchResult
  } from './temp-logic';

  export default {
    name: 'PosOrderScreenNumberKeyboard',
    setup() {
      const numpad_1 = [
        {
          content: ['7'],
          classes: 'key-number bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key7; border: 1px solid #979797'
        },
        {
          content: ['8'],
          classes: 'key-number bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key8; border: 1px solid #979797'
        },
        {
          content: ['9'],
          classes: 'key-number bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key9; border: 1px solid #979797'
        },
        {
          content: ['4'],
          classes: 'key-number bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key4; border: 1px solid #979797'
        },
        {
          content: ['5'],
          classes: 'key-number bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key5; border: 1px solid #979797'
        },
        {
          content: ['6'],
          classes: 'key-number bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key6; border: 1px solid #979797'
        },
        {
          content: ['1'],
          classes: 'key-number bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key1; border: 1px solid #979797'
        },
        {
          content: ['2'],
          classes: 'key-number bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key2; border: 1px solid #979797'
        },
        {
          content: ['3'],
          classes: 'key-number bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key3; border: 1px solid #979797'
        },
        {
          content: ['0'],
          classes: 'key-number bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key0; border: 1px solid #979797'
        },
        {
          content: ['00'],
          classes: 'key-number bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key00; border: 1px solid #979797'
        },
        {
          content: ['x'],
          classes: 'key-number bg-white ba-blue-9 ba-thin',
          action: (value) => !value || value.includes(' x ') ? value : `${value} x `,
          style: 'grid-area: keyX; border: 1px solid #979797'
        },
        { content: ['C'], classes: 'key-number bg-white ba-blue-9 ba-thin', action: () => '', style: 'grid-area: keyC; border: 1px solid #979797' },
        { img: 'delivery/key_enter', classes: 'key-number white', type: 'enter', action: () => null, style: 'grid-area: Enter; border: 1px solid #979797' }
      ]

      async function openDialogProductSearchResults() {
        if (productIdQuery.value.trim()) {
          await queryProductsById()
          if (productIdQueryResults.value.length === 1) {
            const onlyResult = productIdQueryResults.value[0];
            if (onlyResult.attributes.keys().length === onlyResult.attributes.length) {
              addProductToOrder(onlyResult)
              return
            }
            await nextTick(() => {
              showDialogProductSearchResult.value = true
            })
          }
        }
      }

      return genScopeId(() => (
          <g-number-keyboard
              v-model={productIdQuery.value}
              items={numpad_1}
              onSubmit={openDialogProductSearchResults}
              v-slots={{
                screen: () => (
                  <div class="number-key-show ba-thin bg-grey-lighten-3" style="height: calc(16.6667% - 4px)">
                    <input id="number_key_output"
                           class="number-key-text col-12 self-center bg-transparent fs-large-2 fw-700 pl-2"
                           style="border: none; outline: none"
                           v-model={productIdQuery.value}/>
                  </div>
                )
              }}>
          </g-number-keyboard>
      ))

    }
  }
</script>

<style scoped lang="scss">
  .keyboard {
    padding: 8px 0 8px 8px;
    height: 100%;

    ::v-deep .keyboard__template {
      grid-template-rows: repeat(5, calc(20% - 3.67px))!important;
    }
  }


  @media screen and (max-height: 600px) {
    .keyboard {

      ::v-deep .key {
        font-size: 14px;
      }
    }
  }
</style>
