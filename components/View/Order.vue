<template>
  <div>
    <div>order screen</div>
    <div>
      <span>isMobilePage: {{isMobilePage}}</span>
    </div>
    <div>
      <span>table: {{table}}</span>
    </div>
  </div>
</template>

<script>
import { useRoute } from 'vue-router';
import { ref } from 'vue';

export default {
  name: 'Order',
  setup() {
    const isMobilePage = ref(false)
    const route = useRoute()
    console.log(route)
    const pathArr = route.path.split('/').filter(i => !!i)
    const { id: table } = route.params
    if (pathArr[0] === 'pos-order-mobile') isMobilePage.value = true

    return {
      isMobilePage, table
    }
  }
}
</script>

<style scoped>

</style>
