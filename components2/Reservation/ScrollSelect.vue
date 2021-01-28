<script>
import { ref, computed, withModifiers } from 'vue'
import { genScopeId } from '../utils';
import _ from 'lodash'
export default {
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
    const height = ref(props.height)
    const itemHeight = ref(props.itemHeight)
    const modelValue = ref(props.modelValue)
    const selectedColor = ref(props.selectedColor)
    const items = ref(props.items)
    const container = ref(null)
    const computedList = computed(() => {
      return ['', '',...items.value,'', '']
    })
    const computedItemHeight = computed(() => {
      return isNaN(+itemHeight.value) ? 0 : `${itemHeight.value}px`
    })
    const computedHeight = computed(() => {
      return isNaN(+height.value) ? 0 : `${height.value}px`
    })
    const computedTop = computed(() => {
      return isNaN(+itemHeight.value) ? 0 : `calc(50% - ${itemHeight.value/2}px)`
    })
    const itemSelected = computed(() => {
      return !!items.value.find(item => item === modelValue.value)
    })

    const handleScroll = _.debounce(function (event) {
      const precision = ('' + itemHeight.value).length - 1
      const index = _.round(event.target.scrollTop / itemHeight, precision)
      emit('update:modelValue', items[index])
    }, 100)

    function scrollToValue() {
      const index = items.value.indexOf(modelValue.value)
      setTimeout(() => {
        container.value.scrollTop = itemHeight.value * index
      }, 100)
    }

    function chooseItem(item, index) {
      if (!item) return
      emit('update:modelValue', item)
      container.value.scroll({top: itemHeight.value * (index - 2), behavior: 'smooth'})
    }

    return genScopeId(() =>
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
                         style={{ height: computedItemHeight.value, ...modelValue.value === item && { color: 'white', fontWeight: '700' } }}>
                      {item}
                    </div>
                  </slot>
              )} </div>
          </div>
          {
            (itemSelected.value) &&
            <div class="selected" style={{ height: computedHeight.value }}>
              <div class="selected--item" style={{ height: computedItemHeight.value, top: computedTop.value, background: selectedColor.value }}></div>
            </div>
          }
        </div>)
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
