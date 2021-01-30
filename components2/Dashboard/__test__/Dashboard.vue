<script>
import ContentRender from "../../../components/common/ContentRender";
import {h, KeepAlive, onActivated, onDeactivated, ref} from "vue";
import {contentView} from "./dashboard-shared";


const TextField = {
  setup(props) {
    const count = ref(0);
    const init = () => {
      count.value++;
    };

    onActivated(() => {
      init();
      console.log('onActivated');
    })

    onDeactivated(() => {
      console.log('onDeactivated');
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
  components: {
    ContentRender,
  },
  setup() {
    return () => <KeepAlive>
      {h(views[contentView.value.name])}
    </KeepAlive>
  }
}
</script>

<style scoped>

</style>
