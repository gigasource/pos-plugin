<template>
  <div class="version-control">
    <div class="version-control__title">List Version Control</div>
    <div class="version-control__action-bar">
      <g-btn-bs border-color="indigo accent-2" icon="add@20" @click="dialog.newApp = true">Add New App</g-btn-bs>
      <g-btn-bs background-color="indigo accent-2" text-color="white" icon="add@20"
                :disabled="noApp"
                style="margin-right: 0; font-size: 15px" @click="openVersionDialog()">Add New Version
      </g-btn-bs>
    </div>
    <div class="version-control__table">
      <div class="version-control__table-header">
        <div class="col-3 pl-3" @click="sortAppItem('version')">
          Version
          <g-icon v-if="sort.type === 'version'" size="16">{{sort.order === 'asc' ? 'fas fa-long-arrow-alt-up' : 'fas fa-long-arrow-alt-down'}}</g-icon>
        </div>
        <div class="col-1 pl-1" @click="sortAppItem('type')">
          Type
          <g-icon v-if="sort.type === 'type'" size="16">{{sort.order === 'asc' ? 'fas fa-long-arrow-alt-up' : 'fas fa-long-arrow-alt-down'}}</g-icon>
        </div>
        <div class="col-1 pl-1">
          From
          <g-icon v-if="sort.type === 'base'" size="16">{{sort.order === 'asc' ? 'fas fa-long-arrow-alt-up' : 'fas fa-long-arrow-alt-down'}}</g-icon>
        </div>
        <div class="col-1 pl-1" @click="sortAppItem('release')">
          Release
          <g-icon v-if="sort.type === 'release'" size="16">{{sort.order === 'asc' ? 'fas fa-long-arrow-alt-up' : 'fas fa-long-arrow-alt-down'}}</g-icon>
        </div>
        <div class="col-2 pl-1" @click="sortAppItem('uploadDate')">
          Upload date
          <g-icon v-if="sort.type === 'uploadDate'" size="16">{{sort.order === 'asc' ? 'fas fa-long-arrow-alt-up' : 'fas fa-long-arrow-alt-down'}}</g-icon>
        </div>
        <div class="flex-equal pl-2">Note</div>
        <div class="col-1"></div>
      </div>
      <div class="version-control__table-content">
        <template v-if="!listVersionControl || listVersionControl.length === 0">
          <div class="version-control__table-content--empty">
            <img alt src="/plugins/pos-plugin/assets/empty_group.svg"/>
            <p class="text-grey-darken-1 mt-2">Version is currently empty</p>
            <g-btn-bs text-color="indigo accent-2" icon="add@16" class="fw-700" @click="openVersionDialog()">Add New Version</g-btn-bs>
          </div>
        </template>
        <template v-else>
          <div v-for="(group, i) in listVersionControl" :key="`group_${i}`">
            <div class="version-control__group">
              <div class="version-control__group-header" @click="toggleGroup(group)" @mouseenter="toggleEditBtn(i, true)" @mouseleave="toggleEditBtn(i, false)">
                <g-icon size="20" v-if="group.show">expand_less</g-icon>
                <g-icon size="20" v-else>expand_more</g-icon>
                <g-edit-view-input
                    @click.native.stop.prevent="toggleGroup(group)"
                    :value="group.group"
                    class="ml-2"
                    @input="(name, cb) => changeGroupName(group, name, cb)">
                  <template v-slot:action="{mode, switchToEditMode, applyChange, resetValue}">
                    <g-icon v-if="editBtn[i] && mode !== 'edit'" @click="switchToEditMode()" size="18" class="ml-1">mdi-pencil-outline</g-icon>
                    <g-icon v-if="mode === 'edit'" @click="applyChange()" class="ml-1">mdi-check</g-icon>
                    <g-icon v-if="mode === 'edit'" @click="resetValue()" class="ml-1">mdi-close</g-icon>
                  </template>
                </g-edit-view-input>
              </div>
              <g-expand-transition>
                <div v-if="group.show">
                  <div v-for="(file, j) in group.files" :key="`${i}_file_${j}`" :class="getRowClass(j)">
                    <div class="col-3 pl-3">{{file.version}}</div>
                    <div class="col-1 pl-1">{{file.type}}</div>
                    <div class="col-1 pl-1">{{file.base}}</div>
                    <div class="col-1 pl-1">{{file.release}}</div>
                    <div class="col-2 pl-1">{{file.uploadDate | formatDate }}</div>
                    <div class="col-3 changelog">{{file.note}}</div>
                    <div class="col-1 row-flex align-items-center justify-center">
                      <g-menu v-model="file.menu" close-on-content-click nudge-bottom="5">
                        <template v-slot:activator="{on}">
                          <g-icon :class="[file.menu && 'menu--active']" @click="on.click">more_horiz</g-icon>
                        </template>
                        <div class="menu-action">
                          <div class="menu-action__option" @click="openVersionDialog(true, file, group.group)">Edit</div>
                          <div class="menu-action__option" @click="download(file)">Download</div>
                          <div class="menu-action__option" @click="openDialogDeleteVersion(file)">Delete</div>
                        </div>
                      </g-menu>
                    </div>
                  </div>
                </div>
              </g-expand-transition>
            </div>
          </div>
        </template>
      </div>
    </div>
    
    <dialog-delete-item
        v-model="dialog.delete"
        type="version"
        @confirm="deleteFile"/>
    
    <dialog-new-app-item
        v-model="dialog.version"
        v-bind="{...selectedFile, ...newAppItemDialogViewModel}"
        :edit="dialog.edit"
        :group="dialog.group"
        @edit="editFile" @add="addFile"/>
    
    <dialog-new-app
        v-model="dialog.newApp"
        @submit="addNewApp"/>
  </div>
</template>

<script>
  import _ from 'lodash'
  import DialogNewApp from './dialogNewApp';
  import DialogNewAppItem from './dialogNewAppItem';

  export default {
    name: "VersionControl",
    components: { DialogNewApp, DialogNewAppItem },
    injectService: [
        // apps
        'PosOnlineOrderManagementStore:(addApp,changeAppName)',
        // app items
        'PosOnlineOrderManagementStore:(uploadAppItem,editAppItem,removeAppItem)',
        // view model
        'PosOnlineOrderManagementStore:(versionControlViewModel,newAppItemDialogViewModel,versionControlOrderBy,toggleHideShowApp,sortAppItem)'
    ],
    data() {
      return {
        selectedFile: null,
        dialog: {
          version: false,
          edit: false,
          delete: false,
          group: null,
          newApp: false
        },
        editBtn: []
      }
    },
    filters: {
      formatDate(date) {
        return dayjs(date).format('DD/MM/YYYY')
      }
    },
    computed: {
      listVersionControl() {
        return this.versionControlViewModel
      },
      sort() {
        return this.versionControlOrderBy
      },
      noApp() {
        return this.versionControlViewModel.length === 0
      }
    },
    created() {
      this.editBtn = this.listVersionControl ? this.listVersionControl.map(g => false) : []
    },
    // watch: {
    //   listVersionControl(val) {
    //     this.editBtn = val.map(g => false)
    //   }
    // },
    methods: {
      // app
      changeGroupName(group, name, cb) {
        this.changeAppName(group._id, name, res => cb(res.ok))
      },
      toggleGroup(group) {
        this.toggleHideShowApp(group._id)
      },
      
      // app items
      getRowClass(index) {
        const defaultClass = 'version-control__table-row '
        if (index % 2 === 0)
          return defaultClass + 'version-control__table-row--even'
        return defaultClass + 'version-control__table-row--odd'
      },
      openVersionDialog(edit = false, file = null, group = null) {
        this.selectedFile = file
        this.dialog.edit = edit
        this.dialog.group = group
        this.dialog.version = true
      },
      openDialogDeleteVersion(file) {
        this.selectedFile = file
        this.dialog.delete = true
      },
      async addFile(app) {
        await this.uploadAppItem(app)
      },
      async deleteFile() {
        await this.removeAppItem(this.selectedFile._id)
      },
      async editFile(change) {
        await this.editAppItem(this.selectedFile._id, change)
      },
      download(file) {
        window.open(`${location.origin}${file.uploadPath}`)
      },
      toggleEditBtn(index, mode) {
        if(this.editBtn && this.editBtn.length > 0) {
          this.$set(this.editBtn, index, mode)
        }
      },
      addNewApp(name, cb) {
        this.editBtn.push(false)
        this.addApp(name, cb)
      }
    }
  }
</script>

<style scoped lang="scss">
  .version-control {
    height: 100%;

    &__title {
      font-size: 20px;
      line-height: 25px;
      font-weight: 700;
      color: #000000;
      margin-bottom: 24px;
    }

    &__action-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-bottom: 16px;
    }

    &__table {
      background: #FFFFFF;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1398);
      border-radius: 2px;
      overflow: hidden;
      height: calc(100% - 120px);

      &-header {
        background: #EFEFEF;
        height: 38px;
        display: flex;
        align-items: center;
        font-size: 12px;
        font-weight: 700;
        color: #757575;

        & > div {
          cursor: pointer;
        }
      }

      &-content {
        height: calc(100% - 38px);
        overflow: hidden auto;
        scrollbar-width: none; // firefox

        &::-webkit-scrollbar {
          display: none;
        }

        &--empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-items: center;
          margin-top: 64px;

          .g-btn-bs ::v-deep > * {
            font-weight: 700;
          }
        }
      }

      &-row {
        display: flex;
        align-items: center;
        height: 55px;
        font-size: 14px;
        color: #424242;

        &--odd {
          background: #FAFAFC;
        }

        &--even {
          background: #FFFFFF;
        }

        .changelog {
          padding-left: 8px;
          font-weight: 600;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          min-width: 0;
        }
      }
    }

    &__group {
      &-header {
        display: flex;
        align-items: center;
        cursor: pointer;
        font-size: 14px;
        font-weight: 700;
        border-bottom: 1px solid #EFEFEF;

        & > .g-icon {
          margin: 16px;
          box-shadow: 0.5px 0px 2px rgba(0, 0, 0, 0.1398);
        }
      }
    }
  }

  .menu {
    &--active {
      border-radius: 50%;
      background: #F4F5FA;
      color: #1d1d26 !important;
    }

    &-action {
      background: white;
      border-radius: 2px;

      &__option {
        color: #201F2B;
        padding: 8px 36px 8px 12px;
        white-space: nowrap;
        font-size: 14px;
        cursor: pointer;

        &:hover {
          background-color: #EFEFEF;
        }
      }
    }
  }
</style>
