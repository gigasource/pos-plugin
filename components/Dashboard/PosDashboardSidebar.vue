<template>
  <g-sidebar>
    <template v-slot:header>
      <div class="sidebar-header">
        <div class="sidebar-header__avatar">{{firstUserLetter}}</div>
        <span class="sidebar-header__username">{{userName}}</span>
        <g-spacer/>
        <span>{{ now }}</span>
      </div>
    </template>
    <slot name="above-tree-view"/>
    <g-side-bar-tree-view
        ref="tree"
        :item-children="itemChildren"
        :data="items"
        v-model="sidebar"
        :no-padding="false"
        @node-selected="onNodeSelected"
        @node-expansion-toggled="toggleNode"/>
    <slot name="above-spacer"/>
    <g-spacer/>
    <slot name="below-spacer"/>
    <slot name="footer">
      <g-btn :uppercase="false" large text background-color="white" text-color="#424242" width="100%" @click.stop="logout">
        <g-icon svg>icon-logout</g-icon>
        <span class="ml-2">Log Out</span>
      </g-btn>
    </slot>
  </g-sidebar>
</template>

<script>
  import _ from 'lodash'

  export default {
    name: 'PosDashboardSidebar',
    injectService: [ 'PosStore:(logout)' ],
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
        return cms.loginUser.user.username
      },
      firstUserLetter() {
        return _.toUpper(this.userName[0])
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
    },
    watch: {
      defaultPath(val) {
        this.sidebar = val
      }
    },
    methods: {
      itemChildren(node) {
        if (node.children) {
          return node.children.bind(this)();
        }
        return node.items;
      },
      toggleNode(path, toggled, node) {
        this.$emit('toggle', path, toggled)
        this.selectedNode = node;
        this.sidebar = path
        node.onClick && node.onClick.bind(this)();
      },
      onNodeSelected(node) {
        this.selectedNode = node;
        node.onClick && node.onClick.bind(this)();
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
      
      &__username {
        word-break: break-all;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: 14px;
        font-weight: 600;
        padding-left: 8px;
        max-width: 140px;
        white-space: nowrap;
        text-overflow: ellipsis;
        display: block;
      }
      
      $avatarSize: 40px;
      
      &__avatar {
        width: $avatarSize;
        height: $avatarSize;
        line-height: $avatarSize;
        text-align: center;
        border-radius: 50%;
        background: #0e5bad;
        color: #FFF
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
  
  .g-btn ::v-deep .g-btn__content {
    justify-content: flex-start;
    color: #424242;
    font-size: 14px;
  }
</style>
