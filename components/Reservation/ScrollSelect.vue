<template>
  <div style="position: relative;">
    <div class="scroll-select" :style="{height: computedHeight}" ref="container" @scroll.stop="handleScroll">
      <div class="scroll-select__container">
        <template v-for="(item, index) in computedList">
          <slot name="item">
            <div class="scroll-select__container--item" :key="index" :id="item"
                 :style="{height: computedItemHeight, color: value === item ? 'white' : '#1d1d26', fontWeight: value === item ? '700' : '400'}">
              {{item}}
            </div>
          </slot>
        </template>
      </div>
    </div>
    <div class="selected" :style="{height: computedHeight}">
      <div ref="selected" class="selected--item" :style="{height: computedItemHeight, top: computedTop, background: selectedColor}"/>
    </div>
  </div>
</template>

<script>
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
      value: null,
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
        return ['','',...this.items,'','']
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
    },
    mounted() {
      this.$nextTick(() => {
        this.scrollToValue()
      })
    },
    methods: {
      handleScroll: _.debounce(function (event) {
        const precision = ('' + this.itemHeight).length - 1
        const index = _.round(event.target.scrollTop / this.itemHeight, precision)
        this.$emit('input', this.items[index])
      }, 100),
      scrollToValue() {
        const index = this.items.indexOf(this.value)
        setTimeout(() => {
          this.$refs.container.scrollTop = this.itemHeight * index
        }, 100)
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
