<template>
  <g-sidebar>
    <template v-slot:header>
      <div class="sidebar-header">
        <g-avatar size="40">
          <g-img :src="srcImg"></g-img>
        </g-avatar>
        <span class="username">{{username}}</span>
        <g-spacer/>
        <span>{{ now }}</span>
      </div>
    </template>
    <g-side-bar-tree-view
        ref="tree"
        :item-children="itemChildren"
        :data="items"
        v-model="sidebar"
        @node-selected="onNodeSelected"
        @node-expansion-toggled="(path, toggled) => $emit('toggle', path, toggled)"/>
  </g-sidebar>
</template>

<script>
  export default {
    name: 'OnlineOrderSidebar',
    props: {
      view: null
    },
    data() {
      return {
        srcImg: 'https://loremflickr.com/320/240',
        username: 'Admin',
        now: '',
        sidebar: '',
        items: [
          {
            title: 'Restaurant', icon: 'icon-restaurant', items: []
          },
          {
            title: 'Online Orders', icon: 'icon-delivery',
            items: [
              {
                title: 'Dashboard',
                icon: 'radio_button_unchecked',
                iconType: 'small',
                onClick: () => {
                  this.$emit('update:view', {
                    name: 'Dashboard'
                  })
                }
              },
              {
                title: 'Completed Orders',
                icon: 'radio_button_unchecked',
                iconType: 'small',
                onClick: () => {
                  this.$emit('update:view', {
                    name: 'Order',
                    params: {
                      status: 'completed'
                    }
                  })
                }
              },
              {
                title: 'Declined Orders',
                icon: 'radio_button_unchecked',
                iconType: 'small',
                onClick: () => {
                  this.$emit('update:view', {
                    name: 'Order',
                    params: {
                      status: 'declined'
                    }
                  })
                }
              }
            ]
          },
          {
            title: 'Online Ordering', icon: 'icon-general_setting',
            onClick: () => {
              this.$emit('update:view', {
                name: 'Setting'
              })
            }
          }
        ]
      }
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
      }
    },
    created() {

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

  .g-treeview-wrapper {
    ::v-deep .g-treeview-title {
      font-weight: 700;
      font-size: 14px;
    }

    ::v-deep .g-treeview-children .g-treeview-title {
      font-weight: 400;
    }

    ::v-deep .g-treeview-item.g-treeview__active {
      background: #536DFE;
      box-shadow: 3px 0 10px #6D96CE;
      border-top-right-radius: 4px;
      border-bottom-right-radius: 4px;
      margin-right: 8px;
    }
  }
</style>
