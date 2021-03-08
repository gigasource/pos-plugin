<script>
import { genScopeId } from '../utils';
import { version } from '../AppSharedStates';

export default {
  setup() {
    return genScopeId(() =>
        <div class="version-status">v{version.value}</div>)
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
