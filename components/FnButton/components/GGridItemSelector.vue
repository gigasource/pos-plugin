<template>
  <div :style="{gridTemplateRows: rows, gridTemplateColumns: cols }" class='grid-item-selector'>
    <slot :index="index" :item="item" :toggle-select="toggleSelect" v-for="(item, index) in options"></slot>
    <slot :index="index" :item="item" :toggle-select="toggleSelect" name="selected" v-for="(item, index) in options" v-if="isSelected(item)"></slot>
  </div>
</template>
<script>
  import _ from 'lodash';
  import { computed, ref } from 'vue';
  import {getVModel} from 'pos-vue-framework';

  export default {
    name: 'GGridItemSelector',
    components: {},
    props: {
      template: {
        type: String,
        default: ''
      },
      itemText: {
        type: String,
        default: 'text'
      },
      rows: { type: [Number, String], default: '1fr 1fr' },
      cols: { type: [Number, String], default: '1fr 1fr 1fr 1fr' },
      itemValue: {
        type: String,
        default: 'value'
      },
      returnObject: Boolean,
      multiple: Boolean,
      value: {
        type: [Array, Object, String, Number]
      },
      items: {
        type: Array,
        default: () => []
      }
    },
    data: function () {
      return {
        selectedItems: []
      }
    }, setup(props, context) {
      const internalValue = getVModel(props, context);
      const options = computed(() => {
        if (Array.isArray(props.items)) {
          return props.items;
        }
        return _.map(props.items, (v, k) => ({ text: k, value: v }));
      });

      function convertToReturnItem(originalItem) {
        return (props.returnObject || _.isNumber(originalItem) || _.isString(originalItem))
          ? originalItem
          : originalItem[props.itemValue]
      }

      function toggleSelect(originalItem) {
        const returnItem = convertToReturnItem(originalItem);
        if (props.multiple) {
          if (_.includes(internalValue.value, returnItem)) {
            internalValue.value.splice(internalValue.value.indexOf(returnItem), 1);
          } else {
            if (!internalValue.value || !Array.isArray(internalValue.value)) {
              internalValue.value = ref([returnItem]).value
            } else {
              internalValue.value.push(returnItem);
            }
          }
        } else {
          internalValue.value = internalValue.value === returnItem ? null : returnItem;
        }
      }

      function isSelected(originalItem) {
        const returnItem = convertToReturnItem(originalItem);
        if (props.multiple) {
          if (_.includes(internalValue.value, returnItem)) {
            return true;
          }
        }
        return internalValue.value === returnItem;
      }

      return {
        internalValue,
        options,
        isSelected,
        toggleSelect
      }
    },
  }
</script>

<style lang="scss" scoped>
  .grid-item-selector {
    display: grid;
    grid-gap: 4px;
    width: 100%;
    height: 100%;
  }
</style>
