<template>
  <g-dialog fullscreen v-model="internalValue" content-class="dialog-inventory-category">
    <div class="dialog">
      <div :class="showKeyboard ? 'dialog-left' : 'dialog-center'">
        <div class="category">
          <div v-for="(category, i) in categories" class="category-item" :key="i">
            <g-text-field-bs :rules="rules" @click="showKeyboard = true" virtual-event v-model="category.name"/>
            <div @click="removeCategory(category, i)" :class="['category-item__btn', category.available && 'category-item__btn--delete']">
              <g-icon>icon-delete2</g-icon>
            </div>
          </div>
        </div>
        <p>* {{$t('inventory.onlyEmpty')}}</p>
        <div class="dialog-action">
          <g-btn-bs icon="add" background-color="#1271FF" @click="addCategory">{{$t('article.category')}}</g-btn-bs>
          <g-btn-bs background-color="#388E3C" @click="complete">{{$t('inventory.complete')}}</g-btn-bs>
        </div>
      </div>
      <div v-if="showKeyboard" class="dialog-keyboard">
        <pos-keyboard-full type="alpha-number"/>
      </div>
      <div class="dialog-overlay" @click="internalValue = false"></div>
    </div>
  </g-dialog>
</template>

<script>
  import _ from 'lodash'
  import PosKeyboardFull from '../pos-shared-components/PosKeyboardFull';

  export default {
    name: "dialogInventoryCategory",
    components: {PosKeyboardFull},
    injectService: ['InventoryStore:(loadCategoriesWithItem, updateInventoryCategory, loadInventoryCategories, deleteInventoryCategory)'],
    props: {
      modelValue: Boolean
    },
    data() {
      return {
        showKeyboard: false,
        categories: [],
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.modelValue
        },
        set(val) {
          this.showKeyboard = false
          this.$emit('update:modelValue', val)
        }
      },
      rules() {
        let rules = []
        const categories = this.categories.map(cate => cate.name)
        rules.push(val => categories.filter(cate => cate === val).length <=1 || '')
        return rules
      }
    },
    watch: {
       async internalValue(val) {
         if(val) {
           this.categories = await this.loadCategoriesWithItem()
         }
       }
    },
    methods: {
      addCategory() {
        this.categories.unshift({
          name: '',
          available: true
        })
      },
      async removeCategory(category, index) {
        if(!category.available) return
        if(category._id) await this.deleteInventoryCategory(category._id)
        this.categories.splice(index, 1)
      },
      async complete() {
        if(_.some(_.countBy(this.categories, 'name'), cate => cate > 1)) {
          return
        }
        await this.updateInventoryCategory(this.categories)
        await this.loadInventoryCategories()
        this.internalValue = false
      }
    }
  }
</script>

<style scoped lang="scss">
  .dialog {
    width: 100%;
    height: 100%;
    position: relative;

    &-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 1;
      background-color: #21212121;
    }

    &-keyboard {
      position: absolute;
      z-index: 2;
      left: 33%;
      bottom: 0;
      right: 0;
      background-color: #bdbdbd;
      padding: 4px;
    }

    &-center, &-left {
      position: absolute;
      background: white;
      padding: 8px;
      width: 33%;
      z-index: 2;
      display: flex;
      flex-direction: column;

      .category {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: auto;

        & ~ p {
          font-size: 12px;
          font-style: italic;
          color: #757575;
          margin-bottom: 8px;
        }

        &-item {
          display: flex;
          align-items: center;
          padding-right: 4px;

          .bs-tf-wrapper {
            margin: 4px 0 4px 4px ;
            flex: 1;

            ::v-deep {
              .bs-tf-inner-input-group {
                border-radius: 4px 0 0 4px;
              }
            }
          }

          &__btn {
            background-color: #bdbdbd;
            height: 38px;
            flex: 0 0 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0 4px 4px 0;

            &--delete {
              background-color: #FF4452;
            }
          }
        }
      }
    }

    &-action {
      display: flex;

      .g-btn-bs {
        margin: 4px;
        flex: 1;
      }
    }

    &-center {
      top: 16px;
      left: 33%;
      bottom: 16px;
    }

    &-left {
      top: 0;
      left: 0;
      bottom: 0;
      right: 33%;
    }
  }
</style>

<style>
  .g-dialog-wrapper .dialog-inventory-category {
    transition: none;
  }
</style>
