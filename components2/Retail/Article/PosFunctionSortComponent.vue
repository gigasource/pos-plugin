<template>
  <div style="padding: 5px 21.5% 5px 5px; display: flex; justify-content: flex-start; width: 100%">
    <div style="display: grid; grid-template-columns: 53px 53px; grid-template-rows: 46px; grid-gap: 17px; width: 202px; height: 150px;">
      <div style="grid-column: 1 / 2; grid-row: 1 / 2;">
        <g-btn :uppercase="false" height="46" outlined style="color: #757575; min-width: 53px;" width="53" @click="switchProductOrder('left', activeCategory)">
          <g-icon size="34">mdi-menu-left</g-icon>
        </g-btn>
      </div>
      <div style="grid-column: 2 / 3; grid-row: 1 / 2;">
        <g-btn :uppercase="false" height="46" outlined style="color: #757575;  min-width: 53px;" width="53" @click="switchProductOrder('right', activeCategory)">
          <g-icon size="34">mdi-menu-right</g-icon>
        </g-btn>
      </div>
    </div>
  </div>
</template>

<script>
  import { activeCategory, switchProductOrder } from '../pos-article-logic';

  export default {
    name: 'PosFunctionSortComponent',
    setup() {
      return {
        activeCategory,
        switchProductOrder
      }
    }
  }
</script>

<style scoped>

</style>
