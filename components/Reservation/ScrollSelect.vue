<template>
  <div class="scroll-select__wrapper">
    <div class="scroll-select" :style="{height: computedHeight}" ref="container" @scroll.stop="handleScroll">
      <div class="scroll-select__container">
        <template v-for="(item, index) in computedList">
          <slot name="item">
            <div class="scroll-select__container--item" :key="index" :id="item" @click="chooseItem(item, index)"
                 :style="{height: computedItemHeight, ...modelValue === item && { color: 'white', fontWeight: '700' }}">
              {{item}}
            </div>
          </slot>
        </template>
      </div>
    </div>
    <div v-if="itemSelected" class="selected" :style="{height: computedHeight}">
      <div ref="selected" class="selected--item" :style="{height: computedItemHeight, top: computedTop, background: selectedColor}"/>
    </div>
  </div>
</template>

<script>
  import { nextTick } from 'vue';

  export default {
    name: 'ScrollSelect',
    props: {
      height: {
        type: Number,
        default: 500
      },
      itemHeight: {
        type: Number,
        default: 100
      },
      modelValue: null,
      items: {
        type: Array,
        default: () => ['item0', 'item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7', 'item8', 'item9']
      },
      selectedColor: {
        type: String,
        default: '#00e5ff'
      }
    },
    computed: {
      computedList() {
        return ['', '',...this.items,'', '']
      },
      computedItemHeight() {
        return isNaN(+this.itemHeight) ? 0 : `${this.itemHeight}px`
      },
      computedHeight() {
        return isNaN(+this.height) ? 0 : `${this.height}px`
      },
      computedTop() {
        return isNaN(+this.itemHeight) ? 0 : `calc(50% - ${this.itemHeight/2}px)`
      },
      itemSelected() {
        return !!this.items.find(item => item === this.modelValue)
      }
    },
    mounted() {
      nextTick(() => {
        this.scrollToValue()
      })
    },
    methods: {
      handleScroll: _.debounce(function (event) {
        const precision = ('' + this.itemHeight).length - 1
        const index = _.round(event.target.scrollTop / this.itemHeight, precision)
        this.$emit('update:modelValue', this.items[index])
      }, 100),
      scrollToValue() {
        const index = this.items.indexOf(this.modelValue)
        setTimeout(() => {
          this.$refs.container.scrollTop = this.itemHeight * index
        }, 100)
      },
      chooseItem(item, index) {
        if (!item)
          return
        this.$emit('update:modelValue', item)
        this.$refs.container.scroll({top: this.itemHeight * (index - 2), behavior: 'smooth'})
      }
    }
  }
</script>

<style scoped lang="scss">
  .scroll-select {
    z-index: 10;
    position: relative;
    overflow-y: scroll;
    scroll-snap-type: y mandatory;
    transform: translateZ(0px);

    &__wrapper {
      position: relative;
    }

    &::-webkit-scrollbar {
      display: none;
    }

    &__container {
      position: relative;
      margin: 0;

      &--item {
        list-style: none;
        scroll-snap-align: start;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #1d1d26;
        font-weight: 400;

        span {
          vertical-align: middle;
        }

        &:nth-child(-n+2),
        &:nth-last-child(-n+2){
          border: none;
        }
      }
    }
  }

  .selected {
    z-index: 9;
    width: 100%;
    position: absolute;
    top: 0;

    &--item {
      position: absolute;
      width: 100%;
      z-index: 9;
      color: white;
    }
  }
</style>
