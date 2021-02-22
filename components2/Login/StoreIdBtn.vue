<script>
import { genScopeId } from '../utils';
import { computed, onActivated, withModifiers } from 'vue'
import { appHooks, posSettings, storeId } from '../AppSharedStates';
import { useRouter } from 'vue-router'

export default {
  setup() {
    const router = useRouter()
    const skipPairing = computed(() => {
      return posSettings.value && posSettings.value.skipPairing
    })

    function pair() {
      router.push('/pos-setup')
    }

    onActivated(() => {
      appHooks.emit('updateStoreId')
    })

    return genScopeId(() => (
        (storeId.value) ?
            <g-btn-bs>
              ID: {storeId.value}
            </g-btn-bs>
            :
            (
                (!storeId.value && skipPairing.value) &&
                <g-btn-bs onClick={withModifiers(pair, ['stop'])}>
                  Pair
                </g-btn-bs>
            ))
    )
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
    padding: 0;
  }
}
</style>
