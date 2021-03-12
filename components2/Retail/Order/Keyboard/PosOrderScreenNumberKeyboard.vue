<script>
  import { nextTick, ref } from 'vue';
  import { genScopeId } from '../../../utils';
  import DialogProductSearchResult from './dialogProductSearchResult';
  import {products} from "../../../Product/product-logic";
  import { getCurrentOrder, addProduct } from "../../../OrderView/pos-logic-be"

  export default {
    name: 'PosOrderScreenNumberKeyboard',
    components: { DialogProductSearchResult },
    setup() {
      const numpad_1 = [
        {
          content: ['7'],
          classes: 'bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key7; border: 1px solid #979797'
        },
        {
          content: ['8'],
          classes: 'bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key8; border: 1px solid #979797'
        },
        {
          content: ['9'],
          classes: 'bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key9; border: 1px solid #979797'
        },
        {
          content: ['4'],
          classes: 'bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key4; border: 1px solid #979797'
        },
        {
          content: ['5'],
          classes: 'bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key5; border: 1px solid #979797'
        },
        {
          content: ['6'],
          classes: 'bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key6; border: 1px solid #979797'
        },
        {
          content: ['1'],
          classes: 'bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key1; border: 1px solid #979797'
        },
        {
          content: ['2'],
          classes: 'bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key2; border: 1px solid #979797'
        },
        {
          content: ['3'],
          classes: 'bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key3; border: 1px solid #979797'
        },
        {
          content: ['0'],
          classes: 'bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key0; border: 1px solid #979797'
        },
        {
          content: ['00'],
          classes: 'bg-white ba-blue-9 ba-thin',
          action: (value, append) => (value + append),
          style: 'grid-area: key00; border: 1px solid #979797'
        },
        {
          content: ['x'],
          classes: 'bg-white ba-blue-9 ba-thin',
          action: (value) => !value || value.includes(' x ') ? value : `${value} x `,
          style: 'grid-area: keyX; border: 1px solid #979797'
        },
        { content: ['C'], classes: 'bg-white ba-blue-9 ba-thin', action: () => '', style: 'grid-area: keyC; border: 1px solid #979797' },
        { img: 'delivery/key_enter', classes: 'white', type: 'enter', action: () => null, style: 'grid-area: Enter; border: 1px solid #979797' }
      ]

      const showDialogProductSearchResult = ref(false)
      const productIdQuery = ref('')
      const productIdQueryResults = ref([])

      const queryProductsById = () => {
        let quantity;
        if (productIdQuery.value.includes('x')) {
          const queryStrArr = productIdQuery.value.split(' ')
          quantity = parseInt(queryStrArr[2]);
          productIdQuery.value = queryStrArr[0]
        }
        const results = products.value.filter(item => item.id === productIdQuery.value)
        if (results) {
          productIdQueryResults.value = results.map(product => ({
            ...product,
            originalPrice: product.price,
            ...quantity && { quantity }
          }))
        }
      }

      async function openDialogProductSearchResults() {
        const order = getCurrentOrder()
        if (productIdQuery.value.trim()) {
          await queryProductsById()
          if (productIdQueryResults.value.length === 1) {
            const product = productIdQueryResults.value[0];
            addProduct(order, product, product.quantity ? product.quantity : 1)
          } else {
            await nextTick(() => {
              showDialogProductSearchResult.value = true
            })
          }
          productIdQuery.value = ''
        }
      }

      return genScopeId(() => (<div>
          <g-number-keyboard
              v-model={productIdQuery.value}
              items={numpad_1}
              style="height: 100%"
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
              }}/>

              <dialog-product-search-result
                  v-model={showDialogProductSearchResult.value}
                  productIdQuery={productIdQuery.value}
                  productIdQueryResults={productIdQueryResults.value}
                  onUpdate:modelValue={() => productIdQuery.value = '' }
              />
           </div>
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
