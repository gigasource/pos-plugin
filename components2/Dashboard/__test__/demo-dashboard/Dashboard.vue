<script>
import {KeepAlive, onActivated, ref, h} from "vue";
import {contentView} from "./dashboard-shared";

const TextField = {
  setup(props) {
    const count = ref(0);
    onActivated(() => {
      count.value++;
      console.log('onActivated');
    })
    return () => <p>{count.value}</p>
  }
}

const TextComp = function () {
  return <p>c</p>
}

const views = {
  TextComp,
  TextField
}

export default {
  name: "Dashboard",
  setup() {
    return () => <KeepAlive>
      {h(views[contentView.value.name])}
    </KeepAlive>
  }
}
</script>

<style scoped>

</style>
