<template>
  <g-number-keyboard area="keyboard" v-model="productIdQuery" :items="numpad_1" @submit="openDialogProductSearchResults">
    <template v-slot:screen>
      <div class="number-key-show ba-thin bg-grey-lighten-3" style="height: calc(16.6667% - 4px)">
        <input id="number_key_output"
               class="number-key-text col-12 self-center bg-transparent fs-large-2 fw-700 pl-2"
               style="border: none; outline: none"
               v-model="productIdQuery"
        />
      </div>
    </template>
  </g-number-keyboard>
</template>

<script>
  import { nextTick } from 'vue';

  export default {
    name: 'PosOrderScreenNumberKeyboard',
    injectService: ['OrderStore:(productIdQuery,queryProductsById,productIdQueryResults,addProductToOrder)'],
    data() {
      return {
        numpad_1: [
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
      }
    },
    methods: {
      async openDialogProductSearchResults() {
        if (this.productIdQuery.trim()) {
          await this.queryProductsById()
          if (this.productIdQueryResults.length === 1) {
            const onlyResult = this.productIdQueryResults[0];
            if (onlyResult.attributes.keys().length === onlyResult.attributes.length) {
              this.addProductToOrder(onlyResult)
              return
            }
            nextTick(() => {
              this.$getService('dialogProductSearchResult:setActive')(true)
            })
          }
        }
      }
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
