<template>
  <div class="content-render">
    <slot :name="viewName" v-bind="viewParams"/>
  </div>
</template>

<script>
  export default {
    name: 'ContentRender',
    props: {
      view: {
        type: Object,
        default: () => ({ name: '', params: '' })
      },
    },
    computed: {
      viewName() {
        if (this.view)
          return this.view.name
      },
      viewParams() {
        if (this.view)
          return this.view.params
      }
    }
  }
</script>

<style scoped lang="scss">
  .content-render {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
</style>

<style lang="scss">
  @media screen and (max-width: 1023px) {
    .content-render {
      font-size: 14px;
    }
  }
</style>
