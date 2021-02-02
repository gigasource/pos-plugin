<script>
import { ref, computed, withModifiers } from 'vue'
import { genScopeId } from '../utils';
import _ from 'lodash'
export default {
  name: 'ScrollSelect2',
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
  setup(props, { emit }) {
    const container = ref(null)
    const computedList = computed(() => {
      return ['', '',...props.items,'', '']
    })
    const computedItemHeight = computed(() => {
      return isNaN(props.itemHeight) ? 0 : `${props.itemHeight}px`
    })
    const computedHeight = computed(() => {
      return isNaN(props.height) ? 0 : `${props.height}px`
    })
    const computedTop = computed(() => {
      return isNaN(props.itemHeight) ? 0 : `calc(50% - ${props.itemHeight/2}px)`
    })
    const itemSelected = computed(() => {
      return !!_.find(props.items, item => item === props.modelValue)
    })

    const handleScroll = _.debounce(function (event) {
      const precision = ('' + props.itemHeight).length - 1
      const index = _.round(event.target.scrollTop / props.itemHeight, precision)
      emit('update:modelValue', props.items[index])
    }, 100)

    function scrollToValue() {
      const index = _.indexOf(props.items, props.modelValue)
      setTimeout(() => {
        container.value.scrollTop = props.itemHeight * index
      }, 100)
    }

    function chooseItem(item, index) {
      if (!item) return
      emit('update:modelValue', item)
      container.value.scroll({top: props.itemHeight * (index - 2), behavior: 'smooth'})
    }

    const renderFn = genScopeId(() =>
        <div class="scroll-select__wrapper">
          <div class="scroll-select"
               style={{ height: computedHeight.value }}
               ref={container}
               onScroll={withModifiers(handleScroll, ['stop'])}>
            <div class="scroll-select__container">
              {computedList.value.map((item, index) =>
                  <slot name="item">
                    <div class="scroll-select__container--item"
                         key={index} id={item}
                         onClick={() => chooseItem(item, index)}
                         style={{ height: computedItemHeight.value, ...props.modelValue === item && { color: 'white', fontWeight: '700' } }}>
                      {item}
                    </div>
                  </slot>
              )} </div>
          </div>
          {
            (itemSelected.value) &&
            <div class="selected" style={{ height: computedHeight.value }}>
              <div class="selected--item" style={{ height: computedItemHeight.value, top: computedTop.value, background: props.selectedColor }}></div>
            </div>
          }
        </div>)

    // scrollToValue will be use in another component so we must return it
    return {
      scrollToValue,
      renderFn
    }
  },
  render() {
    return this.renderFn()
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
      &:nth-last-child(-n+2) {
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
