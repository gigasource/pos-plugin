<template>
  <div v-if="selectedCategoryLayout" class="category-editor">
    <div class="category-editor__label">{{$t('restaurant.menuEdit.categoriesNo')}}</div>
    <div class="row-flex align-items-center justify-between">
      <div class="fw-700 fs-small mr-2">{{$t('restaurant.menuEdit.columns')}}:</div>
      <input-number
          :model-value="orderLayout.columns" :min="1" :max="8"
          width="148"
          @update:modelValue="changeOrderLayoutColumn"/>
    </div>
    <div class="row-flex align-items-center justify-between mt-1">
      <div class="fw-700 fs-small mr-2">{{$t('restaurant.menuEdit.rows')}}:</div>
      <input-number
          :model-value="orderLayout.rows" :min="1" :max="3"
          width="148"
          @update:modelValue="changeOrderLayoutRow"/>
    </div>

    <div class="category-editor__label">{{$t('ui.name')}}</div>
    <g-text-field-bs
        border-color="#979797"
        :model-value="selectedCategoryLayout.name"
        @update:modelValue="debouncedUpdateCategory({ name: $event })">
      <template v-slot:append-inner>
        <g-icon style="cursor: pointer" @click="dialog.showCategoryNameKbd = true">icon-keyboard</g-icon>
      </template>
    </g-text-field-bs>

    <div class="category-editor__label">{{$t('ui.color')}}</div>
    <color-selector
        :model-value="selectedCategoryLayout.color"
        :colors="colors"
        :item-size="25"
        @update:modelValue="updateCategory({color: $event})"/>

    <div class="category-editor__label">{{$t('restaurant.menuEdit.rowsNo')}}</div>
    <input-number
        :model-value="cateRows" :min="4" :max="10"
        width="148"
        @update:modelValue="updateCategory({rows: $event})"/>

    <div class="category-editor__label">{{$t('restaurant.menuEdit.columnsNo')}}</div>
    <input-number
        :model-value="cateCols" :min="3" :max="6"
        width="148"
        @update:modelValue="updateCategory({columns:$event})"/>

    <template>
      <dialog-text-filter
          :label="$t('restaurant.menuEdit.categoryName')"
          :default-value="selectedCategoryLayout.name"
          v-model="dialog.showCategoryNameKbd"
          @submit="updateCategory({ name: $event}, $event)"/>
      <g-snackbar v-model="showSnackbar" top right color="#1976d2" timeout="1000">
        {{notifyContent}}
      </g-snackbar>
    </template>
  </div>
</template>
<script>
  import _ from 'lodash';
  import ColorSelector from '../common/ColorSelector';
  import InputNumber from './InputNumber';
  import PosKeyboardFull from '../../components2/pos-shared-components/PosKeyboardFull';
  import { reactive, computed, toRefs } from 'vue'
  export default {
    name: 'CategoryEditor',
    components: { PosKeyboardFull, InputNumber, ColorSelector },
    props: {
      orderLayout: Object,
      selectedCategoryLayout: Object,
    },
    emits: ['update:orderLayout'],
    setup(props, context) {
      const state = reactive({
        colors: ['#FFFFFF', '#CE93D8', '#B2EBF2', '#C8E6C9', '#DCE775', '#FFF59D', '#FFCC80', '#FFAB91'],
        dialog: {
          showCategoryNameKbd: false
        },
        showSnackbar: false,
        notifyContent: null,
        debouncedUpdateCategory: () => null
      })

      const cateRows = computed(() => props.selectedCategoryLayout.rows)
      const cateCols = computed(() => props.selectedCategoryLayout.columns)

      const debouncedUpdateCategory = _.debounce(change => {
        updateCategory(change, !props.selectedCategoryLayout._id)
      }, 300)

      async function changeOrderLayoutColumn(columns) {
        const result = await cms.getModel('OrderLayout').findOneAndUpdate({_id: props.orderLayout._id}, { columns }, { new: true })
        showNotify()
        context.emit('update:orderLayout', result)
      }

      async function changeOrderLayoutRow(rows) {
        const result = await cms.getModel('OrderLayout').findOneAndUpdate({_id: props.orderLayout._id}, { rows }, { new: true })
        showNotify()
        context.emit('update:orderLayout', result)
      }

      async function updateCategory(change, forceCreate) {
        console.log('Store ', change, ' to this.selectedCategoryLayout')
        _.assign(props.selectedCategoryLayout, change)

        if (props.selectedCategoryLayout._id) {
          const qry = { 'categories._id': props.selectedCategoryLayout._id }
          const set = _.reduce(change, (result, value, key) => {
            result[`categories.$.${key}`] = value;
            return result
          }, {}) ;
          console.log('update', qry, 'set', set);
          await cms.getModel('OrderLayout').findOneAndUpdate(qry, { $set: set });
          showNotify()
        } else {
          if (forceCreate) {
            console.log('Create new categoryLayout', props.selectedCategoryLayout)
            const orderLayout = await cms.getModel('OrderLayout').findOneAndUpdate(
                { _id: props.orderLayout._id },
                { $push: { categories: props.selectedCategoryLayout } },
                { new: true });
            showNotify()
            context.emit('update:orderLayout', orderLayout)
          } else {
            console.log('CategoryLayout is not existed. Skip.')
          }
        }
      }

      function showNotify(content) {
        state.notifyContent = content || 'Saved'
        state.showSnackbar = true
      }


      return {
        ...toRefs(state),
        cateRows,
        cateCols,
        debouncedUpdateCategory,
        changeOrderLayoutColumn,
        changeOrderLayoutRow,
        updateCategory,
        showNotify
      }
    },
  }
</script>
<style scoped lang="scss">
  .category-editor {
    padding-left: 20px;
    padding-right: 20px;
    height: 100%;
    overflow: auto;

    &__label {
      color: #000;
      margin-top: 16px;
      margin-bottom: 13px;
      font-weight: 700;
      font-size: 15px;
    }

    .bs-tf-wrapper {
      margin: 0;

      ::v-deep .bs-tf-input {
        color: #000;
      }
    }
  }

  .g-snack ::v-deep .g-snack-wrapper {
    min-width: auto;
  }

  @media screen and (max-width: 1023px) {
    .category-editor {
      padding-left: 8px;
      padding-right: 8px;

      &__label {
        font-size: 13px;
        margin-top: 8px;
        margin-bottom: 4px;
      }
    }
  }
</style>
