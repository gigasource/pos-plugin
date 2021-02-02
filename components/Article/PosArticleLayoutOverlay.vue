<template>
  <div style="z-index: 99; background-color: rgba(255, 255, 255, 1); width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;" v-show="!articleSelectedProductButton">
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <g-icon svg size="62" style="margin-bottom: 10px;">icon-info-green</g-icon>
      <p>Please select a button to configure</p>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'PosArticleLayoutOverlay',
    injectService: ['SettingsStore:articleSelectedProductButton'],

  }
</script>

<style scoped>

</style>
