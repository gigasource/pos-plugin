<template>
  <div>Dashboard</div>
  <div class="row-flex">
    <portal-target name="sidebar"/>
    <portal-target :name="activeScreen"/>
  </div>
</template>

<script>
  import { PortalTarget } from 'portal-vue/dist/portal-vue.esm'
  import { activeScreen } from './DashboardSharedStates';

  export default {
    name: 'PosDashboard',
    components: { PortalTarget },
    setup() {
      return { activeScreen }
    }
  }
</script>

<style scoped>

</style>
