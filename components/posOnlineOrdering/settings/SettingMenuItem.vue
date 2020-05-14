<template>
  <div style="border-bottom: 1px solid #E0E0E0">
    <template v-if="mode === 'view'">
      <div class="menu-setting-item" @mouseenter="positioning = true" @mouseleave="positioning = false">
        <div class="ta-center">
          <p v-if="positioning">
            <g-icon style="cursor: pointer" @click="changePosition(true)">fas fa-caret-square-up</g-icon>
          </p>
          <p>{{ index + 1 }}</p>
          <p v-if="positioning">
            <g-icon style="cursor: pointer" @click="changePosition(false)">fas fa-caret-square-down</g-icon>
          </p>
        </div>
        <div class="r">
          <img v-if="image" :src="`${cdnImage}?w=80&h=80`" class="menu-setting-item__image" draggable="false"/>
          <img v-else alt draggable="false" src="/plugins/pos-plugin/assets/empty_dish.svg" class="menu-setting-item__image"/>
          <div class="icon-eyes">
            <g-icon v-if="showImage" size="14" color="white" @click="toggleImage">visibility</g-icon>
            <g-icon v-else size="14" color="white" @click="toggleImage">visibility_off</g-icon>
          </div>
        </div>
        <div class="menu-setting-item__content px-2">
          <div class="menu-setting-item__name row-flex">
            <span class="col-1">{{id ? id + '.' : ''}}</span>
            <span :class="['flex-equal', collapseText && 'collapse']">{{name}}</span>
            <span class="col-3" v-if="useMultiplePrinters">{{groupPrinterStr}}</span>
          </div>
          <pre :class="['menu-setting-item__desc', collapseText && 'collapse']" v-html="desc"/>
        </div>
        <div class="menu-setting-item__content">
          <div class="menu-setting-item__price">${{price}}</div>
          <div class="menu-setting-item__tax">Tax: {{tax}}%</div>
        </div>
        <div class="menu-setting-item__content" style="justify-self: center">
          <g-tooltip :open-on-hover="true" right speech-bubble color="#000" transition="0.3" remove-content-on-close>
            <template v-slot:activator="{on}">
              <div class="menu-setting-item__btn"
                   @mouseenter="on.mouseenter"
                   @mouseleave="on.mouseleave"
                   @click.stop.prevent="switchToEditMode">
                <g-icon color="#FFF" small>mdi-pencil-outline</g-icon>
              </div>
            </template>
            <span>Edit</span>
          </g-tooltip>
          <g-tooltip :open-on-hover="true" right speech-bubble color="#000" transition="0.3" remove-content-on-close>
            <template v-slot:activator="{on}">
              <div class="menu-setting-item__btn mb-3"
                   @mouseenter="on.mouseenter"
                   @mouseleave="on.mouseleave"
                   @click.stop.prevent="deleteItem">
                <g-icon color="#FFF" small>mdi-trash-can-outline</g-icon>
              </div>
            </template>
            <span>Delete</span>
          </g-tooltip>
        </div>
      </div>
    </template>
    <template v-else>
      <setting-new-menu-item
          :index="index"
          :id="id"
          :image="image"
          :name="name"
          :desc="desc"
          :price="price"
          :group-printers="groupPrinters"
          :tax="tax"
          :available-printers="availablePrinters"
          :use-multiple-printers="useMultiplePrinters"
          :show-image="showImage"
          @cancel="cancelEdit"
          @save="saveProduct"/>
    </template>
  </div>
</template>
<script>
  import _ from 'lodash'
  import { getCdnUrl } from '../../Store/utils';
  import SettingNewMenuItem from './SettingNewMenuItem';
  
  export default {
    name: 'SettingMenuItem',
    components: { SettingNewMenuItem },
    props: [ '_id', 'index', 'id', 'image', 'name', 'desc', 'price', 'groupPrinters', 'tax', 'availablePrinters', 'useMultiplePrinters', 'maxIndex', 'collapseText', 'showImage'],
    data: function () {
      return {
        mode: 'view',
        positioning: false,
      }
    },
    filters: {
      currency(value) {
        return $t('common.currency') + value
      }
    },
    computed: {
      groupPrinterStr() {
        return _.join(this.groupPrinters, ',')
      },
      cdnImage() {
        return getCdnUrl(this.image)
      }
    },
    methods: {
      deleteItem() {
        this.$emit('delete')
      },
      switchToEditMode() {
        this.mode = 'edit'
        this.emitEditing(true)
      },
      switchToViewMode() {
        this.mode = 'view'
        this.emitEditing(false)
      },
      cancelEdit() {
        this.switchToViewMode()
      },
      saveProduct(change) {
        this.$emit('save', change)
        this.switchToViewMode()
      },
      emitEditing(editing) {
        this.$emit('editing', editing)
      },
      changePosition(up) {
        if(up) {
          if (this.index === 0) return
          this.$emit('swap', this.index, this.index-1)
        } else {
          if (this.index === this.maxIndex - 1) return
          this.$emit('swap', this.index, this.index+1)
        }
      },
      toggleImage() {
        const val = this.showImage
        this.$emit('save', {showImage: !val})
      }
    }
  }
</script>

<style scoped lang="scss">
  .menu-setting-item {
    display: grid;
    grid-template-columns: 40px 80px 1fr 60px 50px;
    grid-gap: 15px;
    background-color: #fff;
    align-items: center;
    min-height: 112px;

    &__image {
      width: 80px;
      height: 80px;
      border-radius: 10px;

      & ~ .icon-eyes {
        position: absolute;
        bottom: -12px;
        right: -12px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1px solid white;
        background: #757575;
      }
    }

    &__content {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-self: stretch;
      padding: 16px 0;

      ::v-deep .g-tooltip__activator {
        display: inline-flex;
        height: auto;
      }
    }

    &__name,
    &__price {
      font-weight: 700;
      font-size: 15px;

      .collapse {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        max-width: 500px;
      }
    }

    &__desc {
      word-break: break-word;
      font-size: 14px;
      font-style: italic;
      color: #757575;
      max-width: 100%;
      margin-bottom: 24px;
      white-space: pre-wrap;

      &.collapse {
        -webkit-line-clamp: 2;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }

    &__tax {
      font-size: 13px;
      font-style: italic;
      margin-bottom: 24px;
    }

    &__btn {
      background: #616161;
      border-radius: 2px;
      width: 25px;
      height: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      &:hover {
        background: #536DFE;
      }
    }
  }
</style>
