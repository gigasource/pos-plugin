<template>
  <g-snackbar v-model="snackbar.show" top right :color="`${snackbar.error ? '#ff4452' : '#536dfe'}`">{{snackbar.message}}</g-snackbar>
</template>
<script>
  import _ from 'lodash'
  import semverSort from 'semver/functions/sort'
  import semverLt from 'semver/functions/lt'
  import { getCdnUrl } from './utils';

  export default {
    name: 'PosOnlineOrderManagementStore',
    domain: 'PosOnlineOrderManagementStore',
    data: function () {
      return {
        // common
        snackbar: {
          show: false,
          message: '',
          error: false
        },

        // store management
        storeGroups: [],
        stores: [],
        searchText: null,
        orderBy: null,

        // version control
        apps: [],
        appItems: [],
        appShows: {}, /*indicate whether app's item of an app will be shown or not*/
        versionControlOrderBy: { order: 'desc', type: 'uploadDate' },

        // account management
        managerUsers: [],
        accounts: [],
        accountSearch: null,
        accountFilter: {
          createdBy: null,
          storeGroups: null, // array of storeGroup _id
          permissions: null // array of permission name
        },
      }
    },
    computed: {
      // store management
      storeGroupNames() {
        return _.map(this.storeGroups, sg => sg.name)
      },
      searchTextLowerCase() {
        return _.lowerCase(this.searchText)
      },
      storeFilters() {
        const search = this.searchTextLowerCase
        if (search)
          return store => _.includes(_.lowerCase(store.settingName), search) || _.includes(_.lowerCase(store.settingAddress), search) || _.includes(store.id, search)
        return null
      },
      storeSearchSortResult() {
        // apply search
        const stores = this.storeFilters ? _.filter(this.stores, this.storeFilters) : this.stores
        // apply sort
        switch (this.orderBy) {
          case 'lastUpdated': return _.orderBy(stores, 'addedDate', 'desc')
          case 'firstUpdated': return _.orderBy(stores, 'addedDate', 'asc')
          case 'az': return _.orderBy(stores, 'name', 'asc')
          case 'za': return _.orderBy(stores, 'name', 'desc')
          default: return stores
        }
      },
      storeManagementViewModel() {
        const storeGroupVMs = _.map(this.storeGroups, group => ({
          _id: group._id,
          name: group.name,
          stores: _.map(_.filter(this.storeSearchSortResult, store => this.storeInGroup(store, group)), this.convertStoreToViewModel)
        }))
        if (this.searchText)
          return _.filter(storeGroupVMs, storeGroupVM => storeGroupVM.stores.length > 0)
        return storeGroupVMs
      },

      // version control
      appNames() {
        return _.map(this.apps, app => app.name)
      },
      newAppItemDialogViewModel() {
        return {
          listGroup: _.map(this.apps, app => ({ text: app.name, value: app._id })),
          listBaseVersions: _.map(this.versionControlViewModel, app => {
            return {
              group: app._id,
              versions: _.map(app.files, file => ({ text: file.version, value: file.version }))
            }
          }),
          listRelease: [
            {text: 'Beta', value: 'Beta'},
            {text: 'Stable', value: 'Stable'},
            {text: 'Archived', value: 'Archived'},
          ],
          listType: [
            {text: 'APK', value: 'APK'},
            {text: 'PATCH', value: 'PATCH'}
          ],
        }
      },
      orderedAppItems() {
        return _.orderBy(this.appItems, this.versionControlOrderBy.type, this.versionControlOrderBy.order)
      },
      versionControlViewModel() {
        return _.map(this.apps, app => {
          const appViewModel = {
            _id: app._id,
            group: app.name,
            files: [],
            show: this.appShows[app._id]
          }
          _.each(this.orderedAppItems, appItem => {
            if (appItem.app._id === app._id)
              appViewModel.files.push({
                ..._.pick(appItem, ['_id', 'version', 'type', 'release', 'uploadDate', 'uploadPath']),
                base: appItem.baseVersion,
                note: appItem.changeLog,
                menu: false
              })
          })
          return appViewModel
        })
      },

      // accounts
      lowerCaseAccountSearch() {
        return _.lowerCase(this.accountSearch)
      },
      searchAndFilteredAccounts() {
        // TODO: Optimize

        // return only account created by user
        // automatically created account which linked with specified store will not be returned
        const filters = [acc => acc.store == null || acc.store.length === 0]
        if (this.accountSearch)
          filters.push(acc => _.lowerCase(acc.name).indexOf(this.lowerCaseAccountSearch) > -1)
        if (this.accountFilter.createdBy)
          filters.push(acc => acc.createdBy && acc.createdBy._id === this.accountFilter.createdBy)
        if (this.accountFilter.storeGroups)
          filters.push(acc => _.intersection(_.map(acc.storeGroups, sg => sg._id), this.accountFilter.storeGroups).length === this.accountFilter.storeGroups.length)
        if (this.accountFilter.permissions)
          filters.push(acc => _.intersection(_.map(_.filter(acc.permissions, acc => acc.value), p => p.permission), this.accountFilter.permissions).length === this.accountFilter.permissions.length)
        return _.filter(this.accounts, acc => _.every(_.map(filters, filter => filter(acc))))
      },
      accountViewModel() {
        return _.map(this.searchAndFilteredAccounts, account => {
          const perms = _.map(_.filter(account.permissions, perm => perm.value), perm => _.omit(perm, '_id'))
          return {
            // used in dialogAccount.vue
            storeGroups: _.map(account.storeGroups, sg => sg._id),
            permissions: perms,
            // show in Account.vue
            ..._.pick(account, '_id', 'name', 'username', 'active'),
            storeGroupsStr: _.join(_.map(account.storeGroups, sg => sg.name), ', '),
            totalStore: _.filter(this.stores, store => _.some(_.map(account.storeGroups, group => this.storeInGroup(store, group)))).length,
            totalPermissions: perms.length,
            createdBy: account.createdBy && account.createdBy.username,
            status: account.active ? 'active' : 'disabled',
            // menu context display status
            menu: false,
          }
        })
      },
      availableGroupsViewModel() {
        return _.map(this.storeGroups, group => ({ text: group.name, value: group._id }))
      },
    },
    async created() {
      await this.loadStoreGroups()
      await this.loadStores()
      await this.loadApps()
      await this.loadAppItems()
      await this.loadAccounts()
    },
    mounted() {
      cms.socket.on('updateAppFeatureStatus', (msg, error) => {
        this.showMessage(msg, error)
      })
    },
    methods: {
      // common
      showMessage(message, error = true) {
        this.snackbar.message = message
        this.snackbar.error = error
        this.snackbar.show = true
      },
      showSavedMessage() {
        this.showMessage('Saved', false)
      },

      // view model helper methods
      convertStoreToViewModel(store) {
        return {
          ..._.omit(store, 'devices'),
          devices: _.map(store.devices, device => {
            const app = _.find(this.versionControlViewModel, app => app.group === device.appName)
            const appItem = _.filter(app && app.files, appItem => semverSort([appItem.version, device.appVersion])[1] === appItem.version)

            const deviceVersions = appItem.map(this.convertAppItemToViewModel)
            const deviceVersionMap = _.groupBy(deviceVersions, 'version')
            const versions = semverSort(Object.keys(deviceVersionMap)).reverse().map(key => Object.assign(this.convertMapToObject(deviceVersionMap[key]),
                    { text: key, value: key, base: deviceVersionMap[key][0].base }))
            return {
              ...device,
              // store all version of device's app
              versions,
              // store selected version to update, default set to latest version
              updateVersion: deviceVersions.length && deviceVersions[0].value,
              // boolean value used to prevent the user update twice
              canUpdate: true
            }
          })
        }
      },
      convertMapToObject(deviceVersionMap) {
        return _.reduce(deviceVersionMap, (result, item) => {
          result[item.type] = item;
          return result;
        }, {})
      },
      convertAppItemToViewModel(appItem) {
        return {
          // info which will be used by GSelect
          downloadPath: appItem.uploadPath,
          // info which will be used to store in Device collection
          version: appItem.version,
          type: appItem.type,
          release: appItem.release,
          base: appItem.base,
        }
      },
      storeInGroup(store, storeGroup) {
        return _.find(store.groups, group => group._id === storeGroup._id)
      },

      // store groups
      async loadStoreGroups() {
        let storeGroups
        if (cms.loginUser.user.role.name === 'admin') {
          storeGroups = await cms.getModel('StoreGroup').find({})
        } else {
          storeGroups = cms.loginUser.user.storeGroups
        }
        this.storeGroups.splice(0, this.storeGroups.length, ...storeGroups)
      },
      async addGroup(name) {
        if (_.includes(this.storeGroupNames, name)) {
          this.showMessage('This name is already taken!')
          return
        }
        const createdGroup = await cms.getModel('StoreGroup').create({ name })
        const storeGroups = [..._.map(cms.loginUser.user.storeGroups, sg => sg._id), createdGroup._id]
        await cms.getModel('User').findOneAndUpdate({_id: cms.loginUser.user._id}, { storeGroups })
        await cms.updateUserSession()
        await this.loadStoreGroups()
      },
      async changeStoreGroupName(_id, name, cb) {
        if (_.includes(this.storeGroupNames, name)) {
          this.showMessage('This name is already taken!')
          cb && cb(false)
          return
        }
        await cms.getModel('StoreGroup').updateOne({_id}, {name})
        await this.loadStoreGroups()
        cb && cb(true)
      },
      async deleteStoreGroup(_id) {
        // cause be only allow the user to delete empty store group so we don't need to update store
        await cms.getModel('StoreGroup').remove({_id})
        await cms.updateUserSession()
        await this.loadStoreGroups()
      },

      // stores
      async loadStores() {
        const storeGroupIds = _.map(this.storeGroups, sg => sg._id)
        const stores = await cms.getModel('Store').find({groups: {$elemMatch: {$in: storeGroupIds}}})
        this.stores.splice(0, this.stores.length, ...stores)
        await this.checkDeviceOnlineStatus()
      },
      checkDeviceOnlineStatus() {
        return new Promise(resolve => {
          window.cms.socket.emit('getOnlineDeviceIds', async onlineDeviceIds => {
            this.stores.forEach(({devices}) => {
              devices.forEach(device => this.$set(device, 'online', onlineDeviceIds.includes(device._id)))
            })
            resolve()
          })
        })
      },
      async addStore({ settingName, settingAddress, groups, country }) {
        await axios.post('/store/new-store', { settingName, settingAddress, groups, country })
        await this.loadStores()
      },

      async removeStore(groupId, store) {
        const indexOfGroup = _.findIndex(store.groups, g => g._id === groupId)
        store.groups.splice(indexOfGroup, 1)
        const groups = _.map(store.groups, g => g._id)
        if (groups.length > 0) {
          return await this.updateStore(store._id, { groups })
        } else {
          await cms.getModel('Store').remove({_id : store._id})
          await this.loadStores()
        }
      },

      async updateStore(_id, change) {
        await cms.getModel('Store').findOneAndUpdate({_id}, {...change})
        this.showSavedMessage()
        await this.loadStores()
      },

      // devices

      async removeDevice(_id) {
        await axios.post(`/device/unregister`, { _id })
        window.cms.socket.emit('unpairDevice', _id)
        await this.loadStores()
      },

      async updateDevice(_id, change) {
        await cms.getModel('Device').updateOne({_id}, change)
        // load store will reload devices
        await this.loadStores()
      },

      async updateDeviceFeatures(_id, features, cb) {
        const {socket} = window.cms
        socket.emit('updateAppFeature', _id, features, (message) => {
          cb && cb(message)
        })
      },

      async updateDeviceAppVersion(device) {
        if (!device.updateVersion)
          return

        // prevent re-update
        // TODO: UX
        device.canUpdate = false

        const {socket} = window.cms
        const versionInfo = _.find(device.versions, version => version.value === device.updateVersion)
        const type = semverLt(device.appVersion, versionInfo.base) ? 'APK' : 'PATCH'
        socket.emit('updateApp', device._id, getCdnUrl(versionInfo[type].downloadPath), type)
        await cms.getModel('Device').updateOne({_id: device._id}, versionInfo)
        // TODO: Update device version in UI
      },

      // apps
      async loadApps() {
        const apps = await cms.getModel('App').find({})
        this.apps.splice(0, this.apps.length, ...apps)
      },

      async addApp(name, callback) {
        if (_.includes(this.appNames, name)) {
          callback && callback({ ok: false, message: 'App name has been taken!' })
        } else {
          await cms.getModel('App').create({ name })
          callback && callback({ ok: true })
          await this.loadApps()
        }
      },

      async changeAppName(_id, name, callback) {
        let app = _.find(this.apps, app => app.name === name)
        if (app) {
          if (app._id === _id) {
            return
          } else {
            callback && callback({ ok: false, message: 'Name has been taken!' })
            return
          }
        }
        app = _.find(this.apps, app => app._id === _id)
        if (!app) {
          callback && callback({ ok: false, message: 'App is not exist!' })
          return
        }
        const currentAppName = app.name
        await cms.getModel('App').updateOne({_id}, { name })
        await cms.getModel('Device').updateMany({ appName: currentAppName }, { appName: name })
        callback && callback({ ok: true })
        await this.loadApps()  // TODO: just change app name, consider setting value locally without loadApps
      },

      // appItems
      async loadAppItems() {
        const appItems = await cms.getModel('AppItem').find({})
        this.appItems.splice(0, this.appItems.length, ...appItems)
      },

      async uploadAppItem({ file, group, version, type, base, release, note }) {
        const appItemGroupName = _.find(this.apps, app => app._id === group).name
        await this.$getService('FileUploadStore').prepareUploadAppFolder(appItemGroupName, version)
        const uploadPath = await this.$getService('FileUploadStore').uploadApp(appItemGroupName, file, version)
        await cms.getModel('AppItem').create({ version, type, changeLog: note, uploadPath, uploadDate: new Date(), app: group, baseVersion: base, release })
        await this.loadAppItems()
      },

      async editAppItem(_id, { release, note }) {
        const appItem = await cms.getModel('AppItem').findOne({_id})
        if (!appItem)
          return
        await cms.getModel('AppItem').updateOne({_id}, { changeLog: note, release })
        await this.loadAppItems()
      },

      async removeAppItem(_id) {
        const appItem = await cms.getModel('AppItem').findOne({_id})
        // delete file in file explorer
        try {
          await this.$getService('FileUploadStore').removeFile(appItem.uploadPath)
        } catch(e) {} finally {
          // delete document in collection
          await cms.getModel('AppItem').remove({_id})
          await this.loadAppItems()
        }
      },

      toggleHideShowApp(_id) {
        if (_.has(this.appShows, _id)) {
          this.appShows[_id] = !this.appShows[_id]
        } else {
          this.$set(this.appShows, _id, true)
        }
      },

      sortAppItem(type) {
        if (this.versionControlOrderBy.type === type) {
          if (this.versionControlOrderBy.order === 'asc')
            this.versionControlOrderBy.order = 'desc'
          else
            this.versionControlOrderBy.order = 'asc'
        } else {
          this.versionControlOrderBy.type = type
          this.versionControlOrderBy.order = 'asc'
        }
      },

      // Account Management
      async loadAccounts() {
        const accounts = await cms.getModel('User').find({ createdBy: cms.loginUser.user._id })
        this.accounts.splice(0, this.accounts.length, ...accounts)
      },
      clearFilter() {
        this.$set(this, 'accountFilter', {
          createdBy: null,
          storeGroups: null,
          permissions: null
        })
      },
      async createAccount({ name, username, password, storeGroups, permissions }) {
        if (_.find(this.accounts, acc => acc.username === username)) {
          this.showMessage('Username has been taken!')
          return
        }
        const userRole = await cms.getModel('Role').findOne({name: 'user'})
        await cms.getModel('User').create({
          name,
          username,
          password,
          storeGroups,
          permissions,
          active: true,
          role: userRole._id,
          createdBy: cms.loginUser.user._id
        })

        await this.loadAccounts()
      },
      async editAccount(_id, change) {
        if (change.username && _.find(this.accounts, acc => acc.username === change.username && acc._id !== _id)) {
          this.showMessage('Email address has been taken!')
          return
        }
        await cms.getModel('User').updateOne({_id}, change)
        await this.loadAccounts()
      },
      async deleteAccount(_id) {
        const subAccounts = await cms.getModel('User').find({createdBy: _id})
        const ids = [_id, _.map(subAccounts, sa => sa._id)]
        await cms.getModel('User').remove({_id: { $in: ids}})
        await this.loadAccounts()
      }
    },
    provide() {
      return {
        // groups
        storeGroups: this.storeGroups,
        loadStoreGroups: this.loadStoreGroups,
        addGroup: this.addGroup,
        changeStoreGroupName: this.changeStoreGroupName,
        deleteStoreGroup: this.deleteStoreGroup,

        // stores
        stores: this.stores,
        loadStores: this.loadStores,
        addStore: this.addStore,
        removeStore: this.removeStore,
        updateStore: this.updateStore,

        // store management display model
        storeManagementViewModel: this.storeManagementViewModel,
        searchText: this.searchText,
        orderBy: this.orderBy,

        // devices
        removeDevice: this.removeDevice,
        updateDevice: this.updateDevice,
        updateDeviceFeatures: this.updateDeviceFeatures,
        updateDeviceAppVersion: this.updateDeviceAppVersion,

        // apps
        apps: this.apps,
        loadApps: this.loadApps,
        addApp: this.addApp,
        changeAppName: this.changeAppName,

        // app items
        loadAppItems: this.loadAppItems,
        uploadAppItem: this.uploadAppItem,
        editAppItem: this.editAppItem,
        removeAppItem: this.removeAppItem,
        appItems: this.appItems,

        // version control
        versionControlViewModel: this.versionControlViewModel,
        newAppItemDialogViewModel: this.newAppItemDialogViewModel,
        versionControlOrderBy: this.versionControlOrderBy,
        toggleHideShowApp: this.toggleHideShowApp,
        sortAppItem: this.sortAppItem,

        // account management
        availableGroupsViewModel: this.availableGroupsViewModel,
        accountViewModel: this.accountViewModel,
        accountSearch: this.accountSearch,
        accountFilter: this.accountFilter,
        clearFilter: this.clearFilter,
        createAccount: this.createAccount,
        editAccount: this.editAccount,
        deleteAccount: this.deleteAccount,
      }
    }
  }
</script>
<style scoped>
</style>
