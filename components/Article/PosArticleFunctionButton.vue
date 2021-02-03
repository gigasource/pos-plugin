<template>
  <div style="display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr;">
    <g-btn :uppercase="false" height="100%" outlined>F1</g-btn>
    <g-btn :uppercase="false" @click="dialogChangePrice = true" height="100%" outlined>Change Price</g-btn>
    <g-btn :uppercase="false" height="100%" outlined>Note</g-btn>
    <g-btn :uppercase="false" @click="dialogProductLookup = true" height="100%" outlined>Product Lookup</g-btn>
    <g-btn :uppercase="false" disabled height="100%" outlined>Disabled Button</g-btn>
    <g-btn :uppercase="false" height="100%" outlined>Discount</g-btn>
    <g-btn :uppercase="false" height="100%" outlined></g-btn>
    <g-btn :uppercase="false" height="100%" outlined>Plastic Refund</g-btn>
    <g-btn :uppercase="false" style="grid-row: 5 / 7; grid-column: 1 / 2 "  background-color="green lighten 1" height="100%" text text-color="white">
      Quick Cash
    </g-btn>
    <g-btn :uppercase="false" background-color="orange lighten 1" height="100%" text text-color="white">
      Save
    </g-btn>
    <g-btn :uppercase="false" background-color="blue darken 2" height="100%" text text-color="white">
      Pay
    </g-btn>
  </div>
</template>

<script>
export default {
  name: 'PosArticleFunctionButton'
}
</script>

<style lang="scss" scoped>
.g-btn {
  &.g-btn__outlined {
    border: 1px solid #979797;
    background-color: #fafafa;
  }
  &.g-btn__disabled {
    background-color: #DFDFDF;
  }
  &.g-btn__text {
    border: 0;
  }
}
</style>
