<script>
import { genScopeId } from '../utils';

export default {
  emits: ['open'],
  setup(props, { emit }) {
    function openDialogSupport() {
      emit('open')
    }

    return genScopeId(() =>
        <g-btn-bs icon="icon-support@20" onClick={openDialogSupport}>
          Support
        </g-btn-bs>)
  }
}
</script>

<style scoped lang="scss">
.g-btn-bs {
  font-size: 14px;
}

@media screen and (max-width: 1023px) {
  .g-btn-bs {
    font-size: 12px;
  }
}
</style>
