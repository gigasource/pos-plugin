<template>
  <div area="content">
    <slot :name="internalValue"></slot>
  </div>
</template>

<script>
  import _ from 'lodash'
  export default {
    name: 'PosSettingsScreenContent',
    props: {
      value: String,
      sidebar: null
    },
    computed: {
      internalValue() {
        if (!this.value) return this.sidebar[0].key
        const activeItemPath = this.value.split('.').slice(1).join('.')
        const activeItem = _.get(this.sidebar, activeItemPath)
        if (activeItem.isView) return activeItem.key
      }
    }
  }
</script>

<style scoped>

</style>
