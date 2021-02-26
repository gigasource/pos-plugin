<template>
  <g-toolbar height="100%" elevation="0" color="#eee">
    <g-btn-bs icon="icon-back">Back</g-btn-bs>
    <g-menu top nudge-top="5" v-model="showMenu">
      <template v-slot:activator="{toggleContent}">
        <g-btn-bs icon="icon-menu" @click="toggleContent">More</g-btn-bs>
      </template>
      <div class="col-flex bg-white">
        <g-btn-bs icon="icon-dinner_copy">More items</g-btn-bs>
        <g-btn-bs icon="icon-promotion">Discount</g-btn-bs>
      </div>
    </g-menu>

    <g-btn-bs icon="icon-split_check_2">Split check</g-btn-bs>
    <g-btn-bs icon="icon-dinner_2">Div. Item</g-btn-bs>
    <g-btn-bs icon="icon-food_container">Take Away</g-btn-bs>
    <g-btn-bs icon="icon-print">Send</g-btn-bs>
    <g-btn-bs icon="icon-pay">Pay</g-btn-bs>
    <g-btn-bs icon="icon-pay">Pay</g-btn-bs>
  </g-toolbar>
</template>

<script>
  export default {
    name: "PosOrderToolbar",
    data() {
      return {
        showMenu: false
      }
    }
  }
</script>

<style scoped lang="scss">
  .g-btn-bs {
    font-size: 14px;
    background-color: white;
  }
</style>
