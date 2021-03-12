<script>
import _ from 'lodash';
import { getCurrentInstance, onBeforeUnmount, onMounted, computed, ref } from 'vue';
import { genScopeId } from '../utils';

export default {
  props: {
    // not implement yet
    runDoLoadIfHasRemainSpace: Boolean,
    // awaitable
    doLoad: Function,
    // set max-height, min-height, etc...
    containerStyle: Object,
    // define number of px before the user scroll to bottom
    // which will be use to trigger doLoad function
    threshold: {
      type: Number,
      default: 200
    },
  },
  setup(props, { slots }) {
    //fixme: test this
    const container = ref(null)
    const content = ref(null)
    const loading = ref(false)
    const anchorElement = ref(null)

    const doLoadThrotle = _.throttle(() => {
      if (!props.doLoad)
        return;
      try {
        // console.log('run doLoad')
        loading.value = true;
        props.doLoad().then(() => loading.value = false);
      } catch (e) {
        // console.log('do-load exception', e);
        loading.value = true;
      }
    }, 2000)

    function wheelHandle(e) {
      if (e.deltaY < 0 /*wheel up*/ || loading.value || !props.doLoad)
        return;
      if (!content.value)
        return;
      const anchorClientRect = anchorElement.value.getClientRects()[0]
      const contentClientRect = content.value.getClientRects()[0]

      if (contentClientRect.bottom <= anchorClientRect.bottom + props.threshold) {
        doLoadThrotle()
      }
    }

    const wheelHandleThrottle = _.throttle(wheelHandle, 200, { trailing: false })
    // throttle wheel event
    onMounted(() => {
      // loop back to find anchor node (anchor node is a
      // node which doesn't increase
      // it's height when content height increase)
      // if there is no element with fixed height, then body will be selected
      // as anchor node

      const currentInstance = getCurrentInstance()
      if (!currentInstance.anchorElement) {
        let parent = container.value
        while (!currentInstance.anchorElement) {
          if (parent.scrollHeight !== content.value.scrollHeight) {
            currentInstance.anchorElement = parent
          } else {
            parent = parent.parentNode
          }
        }
      }
      //
      if (content.value) {
        content.value.addEventListener('wheel', wheelHandleThrottle)
        content.value.addEventListener('touchend', wheelHandleThrottle)
      }
    })
    onBeforeUnmount(() => {
      if (content.value) {
        content.value.removeEventListener('wheel', wheelHandleThrottle)
        content.value.removeEventListener('touchend', wheelHandleThrottle)
      }
    })
    const lazyLoadContainerStyle = computed(() => {
      return {
        ...(props.containerStyle || {}),
        'overflow-y': 'scroll',
      }
    })
    return genScopeId(() =>
        <div style={lazyLoadContainerStyle.value} ref={container} class="pos-lazy-load">
          <div ref={content}>
            {slots.default && slots.default()}
            {
              (loading.value) &&
              <div class="pos-lazy-load__loading">
                <g-progress-circular indeterminate={true} rotate={0} size={50} width={4} color="blue darken 3"/>
              </div>
            }
          </div>
        </div>
    )
  }
}
</script>
<style scoped lang="scss">
.pos-lazy-load {
  position: relative;

  &__loading {
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
