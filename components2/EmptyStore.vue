<script>
import { onMounted } from 'vue'
import cms from 'cms'
// This file is for emitting screen-loaded
export default {
  name: 'EmptyStore',
  domain: 'EmptyStore',
  props: {},
  setup() {
    onMounted(() => {
      cms.socket.emit('screen-loaded')
    })
  }
}
</script>
