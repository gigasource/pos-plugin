<template>
  <g-grid-select :grid="false" :items="values" :model-value="internalColor" @update:modelValue="updateColor" style="padding: 5px">

    <template #default="{toggleSelect, item, index}">
      <div :key="index" :ripple="false" :style="getColorItemStyle(item)" @click="toggleSelect(item)"/>
    </template>

    <template #selected="{toggleSelect, item, index}">
      <g-badge :badge-size="badgeSize" overlay nudge-top="-6" nudge-right="-6">
        <template v-slot:badge>
          <g-icon color="#FFF">done</g-icon>
        </template>
        <div :key="index" :ripple="false" :style="getColorItemStyle(item)" @click="toggleSelect(item)"/>
      </g-badge>
    </template>

  </g-grid-select>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: 'ColorSelector',
    props: {
      modelValue: String,
      colors: {
        type: Array,
        default: () => ['#FBE4EC', '#CE93D8', '#B2EBF2', '#C8E6C9', '#DCE775', '#FFF59D', '#FFCC80', '#FFAB91']
      },
      itemSize: {
        type: [Number, String],
        default: 38
      },
      badgeSize: {
        type: Number,
        default: 12,
      },
      itemBorderColor: {
        type: String,
        default: '#D2D2D2'
      }
    },
    emits: ['update:modelValue'],
    data() {
      const toColorModel = colors => _.map(colors, (c, i) => ({index: i, text: c, value: c}))
      return {
        internalColor: this.modelValue,
        values: toColorModel(this.colors)
      }
    },
    watch: {
      modelValue(newVal) {
        this.internalColor = newVal
      }
    },
    methods: {
      updateColor(color) {
        this.internalColor = color
        this.$emit('update:modelValue', color)
      },
      getColorItemStyle(item) {
        const itemSelected = this.internalColor === item.value
        return {
          boxShadow: 'none',
          width: `${this.itemSize}px`,
          minWidth: `${this.itemSize}px`,
          height: `${this.itemSize}px`,
          border: `${itemSelected ? 2 : 1}px solid ${itemSelected ? '#1271FF' : '#D2D2D2'}`,
          backgroundColor: item.value,
          borderRadius: '100%',
          marginRight: '4px',
          marginBottom: '4px'
        };
      }
    }
  }
</script>

<style lang="scss" scoped>
  ::v-deep .g-badge {
    background-color: #1271FF !important;
    width: 12px;
    min-width: 12px;

    .g-icon {
      font-size: 10px !important;
      font-weight: bold;
    }
  }
</style>
