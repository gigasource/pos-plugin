<template>
  <div :style="lazyLoadContainerStyle" ref="container" class="pos-lazy-load">
    <div ref="content">
      <slot/>
      <div v-if="loading" class="pos-lazy-load__loading">
        <g-progress-circular :indeterminate="true" :rotate="0" :size="50" :width="4" color="blue darken 3"/>
      </div>
    </div>
  </div>
</template>
<script>
  // WARNING:
  //  - It's work for current use case
  //  - Lack of function
  //  - bug may occured in another case (fix later)
  
  // TODO:
  //  - make lib
  
  import _ from 'lodash'
  
  export default {
    name: 'LazyLoadContainer',
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
    data: function () {
      return {
        loading: false,
        anchorElement: null //
      }
    },
    mounted() {
      // throttle wheel event
      this.wheelHandleThrottle = _.throttle(this.wheelHandle, 200, { trailing: false })
      
      // throttle doLoad function
      this.doLoadThrotle = _.throttle(() => {
        if (!this.doLoad)
          return;
        try {
          // console.log('run doLoad')
          this.loading = true;
          this.doLoad().then(() => this.loading = false);
        } catch (e) {
          // console.log('do-load exception', e);
          this.loading = true;
        }
      }, 2000)
      
      const content = this.$refs.content
      // loop back to find anchor node (anchor node is a
      // node which doesn't increase
      // it's height when content height increase)
      // if there is no element with fixed height, then body will be selected
      // as anchor node
      if (!this.anchorElement) {
        let parent = this.$refs.container
        while(!this.anchorElement) {
          if (parent.scrollHeight !== content.scrollHeight) {
            this.anchorElement = parent
          } else {
            parent = parent.parentNode
          }
        }
      }
      //
      if (content) {
        content.addEventListener('wheel', this.wheelHandleThrottle)
        content.addEventListener('touchend', this.wheelHandleThrottle)
      }
    },
    beforeDestroy() {
      const content = this.$refs.content
      if (content) {
        content.removeEventListener('wheel', this.wheelHandleThrottle)
        content.removeEventListener('touchend', this.wheelHandleThrottle)
      }
      
    },
    computed: {
      lazyLoadContainerStyle() {
        return {
          ...(this.containerStyle || {}),
          'overflow-y': 'scroll',
        }
      }
    },
    methods: {
      wheelHandle(e) {
        if (e.deltaY < 0 /*wheel up*/ || this.loading || !this.doLoad)
          return;
        if (!this.$refs.content)
          return;
        const anchorClientRect = this.anchorElement.getClientRects()[0]
        const contentClientRect = this.$refs.content.getClientRects()[0]
        if (contentClientRect.bottom <= anchorClientRect.bottom + this.threshold) {
          this.doLoadThrotle()
        }
      },
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
