<template>
  <g-btn-bs icon="icon-support@20" @click="openDialogSupport">Support</g-btn-bs>
</template>

<script>
  export default {
    name: "SupportBtn",
    methods: {
      openDialogSupport() {
        this.$getService('dialogLoginSupport:setActive')(true)
      }
    }
  }
</script>

<style scoped lang="scss">
  .g-btn-bs {
    font-size: 14px;
  }

  @media screen and (max-width: 1023px) {
    .g-btn-bs {
      font-size: 12px;
    }
  }
</style>
