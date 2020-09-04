<template>
  <div :class="['digital-menu-item', !available && 'disabled']">
    <template v-if="showImage && displayImage">
      <img v-if="image" alt draggable="false" :src="menuItemThumbnail" class="digital-menu-item__thumbnail" @click.stop="openImage"/>
      <div v-else class="digital-menu-item__thumbnail--default">
        <img alt draggable="false" src="/plugins/pos-plugin/assets/thumbnail.svg"/>
      </div>
    </template>
    <div :class="['digital-menu-item__content', (!choices || choices.length === 0) && 'digital-menu-item__content--no-choices']">
      <div class="digital-menu-item__name">
          <span v-if="displayId">{{ id && `${id}. ` }}</span>
          {{name}}
          <template v-for="(value, type) in mark">
            <g-menu v-if="value.active" v-model="menu[type]" open-on-hover nudge-bottom="5" max-width="375" style="display: inline-block" content-class="menu-status-notification">
              <template v-slot:activator="{on}">
                <div v-on="on" class="ml-1" style="line-height: 18px; cursor: pointer; -webkit-tap-highlight-color: transparent">
                  <g-icon v-if="menu[type]" size="18">{{`icon-${type}_full`}}</g-icon>
                  <g-icon v-else size="18">{{`icon-${type}`}}</g-icon>
                </div>
              </template>
              <div class="pa-2 bg-white br-2">
                <p class="fw-700 mb-1">{{$t('store.productInfo')}}:</p>
                <p class="fs-small text-grey-darken-3">
                  {{value.notice ? value.notice : $t(`store.${type}Notice`)}}
                </p>
                <p v-if="type === 'allergic'">
                  {{getAllergicType(value.types)}}
                </p>
                <p class="fs-small-2 text-grey-darken-3 mt-2">{{$t('store.productInfoWarning')}}</p>
              </div>
            </g-menu>
          </template>
        </div>
      <div v-if="desc" class="row-flex pb-1" @click="toggleShowmore">
        <pre :id="`desc_${_id}`" :class="['digital-menu-item__desc', !showmore && 'digital-menu-item__desc--collapse', (!choices || choices.length === 0) && 'line-4']" v-html="desc"></pre>
        <g-icon v-if="expandDesc" size="12" class="digital-menu-item__show">fas fa-angle-double-{{showmore ? 'left' : 'right'}}</g-icon>
      </div>
      <g-spacer/>
      <div class="row-flex align-items-center" style="margin-bottom: -8px">
        <div class="digital-menu-item__price">{{ itemPrice }}</div>
        <g-spacer/>
        <g-btn-bs v-if="!readonly" rounded @click="addToOrder">
          <g-icon size="28" color="#1271FF">add_circle</g-icon>
        </g-btn-bs>
      </div>
      <div class="digital-menu-item__choice" v-for="(choice, i) in choices" :key="i">
        <div class="digital-menu-item__choice--name">
          {{choice.name}}
          <span v-if="choice.mandatory" class="text-red">*</span>
        </div>
        <div class="digital-menu-item__choice--option" v-for="(option, index) in choice.options" :key="`option_${index}`">
          <div class="pr-3">{{option.name}}</div>
          <div class="fw-700">{{option.price | currency(storeCountryLocale)}}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { getCdnUrl } from '../../Store/utils';

  export default {
    name: "DigitalMenuItem",
    props: {
      _id: String,
      image: String,
      name: String,
      desc: String,
      price: [Number, String],
      price2: [Number, String],
      quantity: Number,
      imageThumbnailSize: {
        type: Object,
        default: () => ({
          width: 240,
          height: 240,
        }),
      },
      collapseText: Boolean,
      showImage: Boolean,
      choices: Array,
      available: Boolean,
      id: String,
      displayId: Boolean,
      mark: Object,
      scrolling: Number,
      displayImage: Boolean,
      storeCountryLocale: String,
      readonly: Boolean
    },
    filters: {
      currency(val, locale) {
        if(val)
          return $t('common.currency', locale) + val.toFixed(2)
        return $t('common.currency', locale) + 0
      }
    },
    data() {
      return {
        menu: {
          allergic: false,
          spicy: false,
          vegeterian: false,
        },
        showmore: false,
        expandDesc: false
      }
    },
    mounted() {
      this.$nextTick(() => {
        const desc = document.getElementById(`desc_${this._id}`)
        if(desc && desc.scrollHeight > desc.offsetHeight) {
          this.expandDesc = true
        }
      })
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
          return `${$t('common.currency', this.storeCountryLocale)}${min.toFixed(2)} - ${$t('common.currency', this.storeCountryLocale)}${max.toFixed(2)}`
        else
          return `${$t('common.currency', this.storeCountryLocale)}${min.toFixed(2)}`
      }
    },
    methods: {
      getAllergicType(types) {
        let allergens = ''
        allergens += types.map(t => this.$t(`store.${t}`)).join(', ')
        return allergens
      },
      toggleShowmore() {
        this.showmore = !this.showmore
      },
      addToOrder() {
        this.$emit('add')
      },
      openImage() {
        this.$emit('image', this.image, this.desc)
      }
    },
    watch: {
      scrolling() {
        this.menu = {
          allergic: false,
          spicy: false,
          vegeterian: false,
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .digital-menu-item {
    background: #FFFFFF;
    box-shadow: 1px 1px 4px rgba(0, 0, 0, 0.14);
    padding: 8px 6px;
    line-height: normal;
    display: flex;

    &__thumbnail {
      border-radius: 6px;
      margin-right: 6px;
      width: 140px;
      height: 140px;

      &--default {
        border-radius: 6px;
        margin-right: 6px;
        width: 140px;
        height: 140px;
        background: #F8F8F8;
        border: 1px solid #EEEEEE;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    &__content {
      flex: 1;

      &--no-choices {
        display: flex;
        flex-direction: column;

        & > div:last-child {
          margin-bottom: 0 !important;
        }
      }
    }

    &__name {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 8px;
      word-break: break-all;
    }

    &__desc {
      font-size: 13px;
      color: #757575;
      word-break: break-word;
      white-space: pre-wrap;
      margin-bottom: 0;
      flex: 1;

      &--collapse {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        user-select: auto;
        overflow: hidden;
        -webkit-line-clamp: 2;

        &.line-4 {
          -webkit-line-clamp: 4;
        }
      }
    }

    &__show {
      font-size: 12px;
      align-self: flex-end;
      color: #1271FF;
    }

    &__choice {
      border-top: 1px solid #E0E0E0;
      margin-top: 8px;
      padding-top: 8px;
      font-size: 13px;

      &--name {
        font-weight: 700;
        margin-bottom: 8px;
        text-transform: capitalize;
      }

      &--option {
        display: flex;
        justify-content: space-between;
        color: #424242;
        margin-bottom: 4px;
      }
    }

    &__price {
      font-size: 16px;
      font-weight: 700;

      & ~ .g-btn-bs {
        padding: 2px;
        margin: 0;

        &:hover:before {
          display: none;
        }
      }
    }
  }

  @media screen and (max-width: 350px) {
    .digital-menu-item {
      &__thumbnail {
        width: 100px;
        height: 100px;

        &--default {
          width: 100px;
          height: 100px;
        }
      }
    }
  }
</style>
