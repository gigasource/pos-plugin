<template>
  <div :class="['po-menu-item', !available && 'disabled']">
    <template v-if="showImage">
      <img v-if="image" alt draggable="false" :src="menuItemThumbnail" class="po-menu-item__thumbnail"/>
      <img v-else alt draggable="false" src="/plugins/pos-plugin/assets/empty_dish.svg"
           class="po-menu-item__thumbnail"/>
    </template>
    <div class="po-menu-item__content">
      <div :class="['po-menu-item__name', collapseText && 'collapse']">
        <span v-if="displayId">{{ id }}.</span>
        {{ name }}
      </div>
      <pre :class="['po-menu-item__desc', collapseText && 'collapse']" v-html="desc"/>
      <div class="po-menu-item__prices--under">
        <div :class="price2 && 'po-menu-item__prices--discount'"> {{ itemPrice }}</div>
        <div v-if="price2"> {{ price2 | currency }}</div>
      </div>
    </div>
    <g-spacer/>
    <div class="po-menu-item__prices">
      <div :class="price2 && 'po-menu-item__prices--discount'"> {{ itemPrice }}</div>
      <div v-if="price2">{{ price2 | currency }}</div>
    </div>
    <g-icon @click="addToOrder" v-if="isOpening"
            size="28" color="#424242"
            :class="['po-menu-item__add', disabled && 'disabled']">
      add_circle
    </g-icon>
    <div class="po-menu-item__action" v-if="isOpening">
      <g-icon @click="addToOrder"
              size="28" color="#424242">
        add_circle
      </g-icon>
    </div>
  </div>
</template>
<script>
  import {getCdnUrl} from '../../Store/utils';

  export default {
    name: 'MenuItem',
    props: {
      _id: String,
      image: String,
      name: String,
      desc: String,
      price: [Number, String],
      price2: [Number, String],
      quantity: Number,
      currencyUnit: String,
      isOpening: Boolean,
      imageThumbnailSize: {
        type: Object,
        default: () => ({
          width: 60,
          height: 60,
        }),
      },
      disabled: Boolean,
      collapseText: Boolean,
      showImage: Boolean,
      choices: Array,
      available: Boolean,
      id: String,
      displayId: Boolean,
    },
    filters: {
      currency(val) {
        return $t('common.currency') + val.toFixed(2)
      }
    },
    methods: {
      addToOrder() {
        this.$emit('menu-item-selected', this._id)
      },
      decreaseQuantity() {
        this.$emit('decrease', this._id)
      },
      increaseQuantity() {
        this.$emit('increase', this._id)
      }
    },
    computed: {
      menuItemThumbnail() {
        const {width, height} = this.imageThumbnailSize
        return `${getCdnUrl(this.image)}?w=${width}&h=${height}`
      },
      itemPrice() {
        let min = this.price, max = this.price
        for (const choice of this.choices) {
          const minOption = _.minBy(choice.options, 'price')
          const maxOption = _.maxBy(choice.options, 'price')
          if (choice.mandatory) {
            min += minOption.price
            max += maxOption.price
          }
        }

        if (min < max)
          return `${$t('common.currency')}${min.toFixed(2)} - ${$t('common.currency')}${max.toFixed(2)}`
        else
          return `${$t('common.currency')}${min.toFixed(2)}`
      }
    },
  }
</script>
<style scoped lang="scss">
  .po-menu-item {
    display: flex;
    align-items: flex-start;
    padding-top: 8px;
    min-height: 80px;

    &__thumbnail {
      border-radius: 11px;
      margin-right: 18px;
      width: 60px;
      height: 60px;

      & ~ .po-menu-item__content {
        max-width: calc(100% - 260px);
      }
    }

    &__name {
      font-weight: bold;
      font-size: 15px;
      max-width: 100%;
      user-select: auto;

      &.collapse {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
      }
    }

    &__content {
      margin-right: 16px;
      max-width: calc(100% - 200px);
    }

    &__desc {
      font-size: 13px;
      color: #757575;
      max-width: 100%;
      word-break: break-word;
      white-space: pre-wrap;
      overflow: hidden;

      &.collapse {
        -webkit-line-clamp: 2;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        user-select: auto;
      }
    }

    &__prices {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      font-size: 18px;
      color: #2979ff;
      font-weight: 700;

      &--discount {
        font-size: 14px;
        font-weight: 400;
        color: #757575;
        text-decoration: line-through;
      }

      &--under {
        display: none;
        font-size: 14px;
        color: #2979ff;
        font-weight: 700;
        margin-top: 4px;
      }
    }

    &__add {
      margin-left: 10px;
    }

    &__action {
      display: none;
    }

    .g-icon {
      -webkit-tap-highlight-color: transparent;
    }
  }

  @media screen and (max-width: 1139px) {
    .po-menu-item {
      &__content {
        line-height: 1.2;
        max-width: calc(100% - 50px);
        margin-right: 4px;
      }

      &__thumbnail {
        margin-right: 8px;

        & ~ .po-menu-item__content {
          max-width: calc(100% - 110px);
        }
      }

      &__name {
        font-size: 14px;
      }

      &__desc {
        font-size: 13px;
      }

      &__prices {
        display: none;

        &--under {
          display: flex;
        }
      }

      &__add {
        display: none;
      }

      &__action {
        flex: 0 0 30px;
        display: flex;
        align-self: flex-end;
        margin-bottom: 8px;
        justify-content: flex-end;

        & > span {
          min-width: 20px;
          text-align: center;
          line-height: 28px;
        }
      }
    }
  }
</style>
