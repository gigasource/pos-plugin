<script>
import DashboardSidebarUI from './DashboardSidebarUI'

const { hooks, fn } = DashboardSidebarUI()

export default fn()
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

<style>
.g-sidebar {
  overflow: auto !important;
}
</style>
