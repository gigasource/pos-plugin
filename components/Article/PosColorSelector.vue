<template>
  <g-grid-select :grid="false" :items="buttonColors" v-model="computedSelectedColor" style="padding: 5px">
    <template #default="{toggleSelect, item, index}">
      <g-btn :uppercase="false" :key="index" :ripple="false" :style="{marginRight: '15px', boxShadow: 'none', width: '38px', minWidth: '38px', height: '38px', border: '1px solid #D2D2D2', backgroundColor: item.value}" @click="toggleSelect(item); setSelectedArticleColor();" border-radius="50%"></g-btn>
    </template>
    <template #selected="{toggleSelect, item, index}">
      <g-badge :badge-size="12" overlay style="margin-right: 15px;">
        <template v-slot:badge>
          <g-icon>done</g-icon>
        </template>
        <g-btn :uppercase="false" :class="activeClass" :style="{boxShadow: 'none', width: '38px', minWidth: '38px', height: '38px', border: '2px solid #1271FF', backgroundColor: item.value}" @click="toggleSelect(item)" border-radius="50%">
          {{item.optionTitle}}
        </g-btn>
      </g-badge>
    </template>
  </g-grid-select>
</template>

<script>

  export default {
    name: 'PosColorSelector',
    injectService: ['SettingsStore:(setSelectedArticleColor, articleSelectedColor, activeCategory)'],
    watch: {
      activeCategory: function (newVal, oldVal) {
        if(newVal !== oldVal)
          this.computedSelectedColor = null;
      }
    },
    computed: {
      computedSelectedColor: {
        get() {
          return this.articleSelectedColor
        },
        set(value) {
          this.articleSelectedColor = value
        }
      },
    },
    data: function () {
      return {
        activeClass: 'color-select-active',
        buttonColors: [
          {
            id: 1,
            text: '#FBE4EC',
            value: '#FBE4EC'
          },
          {
            id: 2,
            text: '#CE93D8',
            value: '#CE93D8'
          },
          {
            id: 3,
            text: '#B2EBF2',
            value: '#B2EBF2'
          },
          {
            id: 4,
            text: '#C8E6C9',
            value: '#C8E6C9'
          },
          {
            id: 5,
            text: '#DCE775',
            value: '#DCE775'
          },
          {
            id: 6,
            text: '#FFF59D',
            value: '#FFF59D'
          },
          {
            id: 7,
            text: '#FFCC80',
            value: '#FFCC80'
          },
          {
            id: 8,
            text: '#FFAB91',
            value: '#FFAB91'
          },
        ],
      }
    },
  }
</script>

<style lang="scss" scoped>
  ::v-deep .g-badge {
    background-color: #1271FF !important;
    width: 12px;
    min-width: 12px;
    left: 20px;
    top: 5px;

    .g-icon {
      font-size: 10px !important;
      font-weight: bold;
    }
  }

  .color-select-active {
    border: 2px solid #1271FF;
  }
</style>
