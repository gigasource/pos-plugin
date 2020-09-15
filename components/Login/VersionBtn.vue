<template>
  <div class="version-status">v {{version}}</div>
</template>

<script>
  export default {
    name: 'VersionBtn',
    props: {
      version: String
    }
  }
</script>

<style lang="scss">
  .version-status {
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media screen and (max-width: 1023px) {
    .version-status {
      font-size: 12px;
    }
  }
</style>
