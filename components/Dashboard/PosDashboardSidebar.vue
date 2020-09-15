<template>
  <g-sidebar medium>
    <template v-slot:header>
      <div class="sidebar-header">
        <g-avatar size="40">
          <g-img :src="srcImg"></g-img>
        </g-avatar>
        <span class="username">{{userName}}</span>
        <g-spacer/>
        <span>{{ now }}</span>
      </div>
    </template>
    <slot name="above-tree-view"/>
    <g-side-bar-tree-view
        ref="tree"
        :item-children="itemChildren"
        :data="computedItems"
        v-model="sidebar"
        @node-selected="onNodeSelected"
        @node-expansion-toggled="(path, toggled) => $emit('toggle', path, toggled)"/>
    <slot name="above-spacer"/>
    <g-spacer></g-spacer>
    <slot name="below-spacer"/>
    <slot name="footer">
      <g-btn :uppercase="false" large text background-color="white" text-color="#424242" width="100%" @click.stop="logout">
        <g-icon svg>icon-logout</g-icon>
        <span class="ml-2">{{$t('sidebar.logOut')}}</span>
      </g-btn>
    </slot>
  </g-sidebar>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: 'PosDashboardSidebar',
    injectService: [ 'PosStore:user' ],
    props: {
      title: {
        type: String,
        default: 'Admin'
      },
      items: Array,
      view: null,
      defaultPath: null,
      afterMountFn: null
    },
    data() {
      return {
        now: '',
        sidebar: '',
        selectedNode: null,
      }
    },
    computed: {
      userName() {
        return this.user ? this.user.name : ''
      },
      srcImg() {
        return this.user ? this.user.avatar : ''
      },
      computedItems() {
        return this.mapTitle(this.items)
      }
    },
    created() {
      this.timerId = setInterval(() => this.now = dayjs().format('HH:mm'), 1000)
    },
    beforeDestroy() {
      clearInterval(this.timerId)
    },
    mounted() {
      if (this.defaultPath)
        this.sidebar = this.defaultPath // 'item.0.item.0'
      if (typeof(this.afterMountFn) === 'function')
        this.afterMountFn()

      const posStore = this.$getService('PosStore')
      posStore.$watch('enabledFeatures', (newVal, oldVal) => {
        if (_.xorWith(newVal, oldVal, _.isEqual).length !== 0 && typeof(this.afterMountFn) === 'function') {
          this.afterMountFn()
          let sidebar = 'item.0' //first item
          if(this.items[0].items && this.items[0].items.length > 0) {
            sidebar += '.item.0'
          }
          this.sidebar = sidebar
        }
      })
    },
    watch: {
      defaultPath(val) {
        this.sidebar = val
      },
    },
    methods: {
      itemChildren(node) {
        if (node.children) {
          return node.children.bind(this)();
        }
        return node.items;
      },
      onNodeSelected(node) {
        this.selectedNode = node;
        node.onClick && node.onClick.bind(this)();
      },
      logout() {
        this.$router.push('/pos-login')
        this.user = null
      },
      mapTitle(items) {
        return items.map(item => {
          if (typeof item.title === 'function') {
            return Object.assign({}, item, {
              title: item.title(),
              ...item.items && {items: this.mapTitle(item.items) }
            })
          }
          return item
        })
      }
    }
  }
</script>

<style scoped lang="scss">
  .g-sidebar {
    .sidebar-header {
      padding: 12px;
      display: flex;
      align-items: center;
      font-size: 14px;
      line-height: 18px;
      font-weight: 600;
      color: #1d1d26;

      .username {
        word-break: break-all;
        -webkit-line-clamp: 2;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: 14px;
        font-weight: 600;
        padding-left: 8px;
      }
    }
  }

  .g-treeview-wrapper ::v-deep .g-treeview-item.g-treeview__active {
    background: linear-gradient(9.78deg, #3949AB 0%, #4FC3F7 100%) !important;
    box-shadow: 0 1px 8px 1px rgba(28, 144, 196, 0.5);
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    margin-right: 8px;
  }

  .g-treeview-wrapper ::v-deep .g-treeview-item .g-treeview-title {
    line-height: 1.2;
    white-space: normal;
    display: -webkit-box;
    word-break: break-word;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .g-btn ::v-deep .g-btn__content {
    justify-content: flex-start;
    color: #424242;
    font-size: 14px;
  }

  .g-treeview-wrapper ::v-deep .g-badge-wrapper {
    margin-right: 16px !important;
  }

  @media screen and (max-width: 1023px) {
    .g-sidebar-wrapper ::v-deep .g-sidebar {
      width: 180px;
      max-width: 180px;

      .g-treeview-wrapper .g-treeview-title {
        font-size: 14px;
      }
    }
  }
</style>
