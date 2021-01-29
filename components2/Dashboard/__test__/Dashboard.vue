<script>
import ContentRender from "../../../components/common/ContentRender";
import {KeepAlive, onActivated, ref, h} from "vue";
import {contentView} from "./dashboard-shared";
import _ from 'lodash';


const TextField = {
  setup(props) {
    const count = ref(0);
    const init = _.debounce(() => {
      count.value ++;
    }, 10);
    init();
    onActivated(() => {
      init();
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
