<template>
  <file-upload-progress-dialog
      v-model="showFileUploadProgressDialog"
      :uploading-items="uploadingItems"
      @update:uploadingItems="uploadingItems = $event"
  />
</template>
<script>
  import createGridFsHandlers from 'vue-file-explorer/api-handlers/grid-fs'
  import openUploadFileDialog from 'vue-file-explorer/api-handlers/openUploadFileDialog'
  import FileUploadProgressDialog from 'vue-file-explorer/components/FileExplorerPanel/dialogs/FileUploadProgressDialog.vue'

  export default {
    name: 'FileUploadStore',
    domain: 'FileUploadStore',
    components: {FileUploadProgressDialog},
    async created() {
      this.gridFsHandler = createGridFsHandlers({
        // namespace: this.$getService('PosStore').accountId,
        apiBaseUrl: '/cms-files'
      })

      await this.createFolder('/', 'images')
      await this.createFolder('/', 'update')
    },
    data() {
      return {
        uploadingItems: [],
        showFileUploadProgressDialog: false,
      }
    },
    computed: {},
    methods: {
      openUploadFileDialog(callback) {
        openUploadFileDialog({ multiple: false, mimeType: 'image/*' }, files => callback(files[0]))
      },
      uploadImage(file) {
        return new Promise((resolve, reject) => {
          this.showFileUploadProgressDialog = true
          this.uploadingItems.push(this.gridFsHandler.uploadFile(file, '/images', response => {
            if (response.data[0].uploadSuccess) {
              resolve(this.gridFsHandler.insertViewUrl([response.data[0].createdFile])[0].viewUrl)
            } else {
              reject(response)
            }
          }))
        })
      },
      async prepareUploadAppFolder(groupName, version) {
        await this.createFolder('/update', groupName)
        await this.createFolder(`/update/${groupName}`, version)
      },
      uploadApp(groupName, file, version) {
        return new Promise(async (resolve ,reject) => {
          this.showFileUploadProgressDialog = true
          this.uploadingItems.push(this.gridFsHandler.uploadFile(file, `/update/${groupName}/${version}`, response => {
            if (response.data[0].uploadSuccess) {
              const files = [response.data[0].createdFile]
              const downloadUrl = this.gridFsHandler.insertDownloadUrl(files)[0].downloadUrl
              resolve(downloadUrl)
            } else {
              reject(response)
            }
          }))
        })
      },

      async removeFile(filePath /*view path or download path*/) {
        const path = filePath.substr(filePath.indexOf('//') + 1)
        try {
          await this.gridFsHandler.deleteFileByPath(path)
        } catch (e) {}
      },
      async isFolderExist(folderPath) {
        try {
          await this.gridFsHandler.getFilesInPath(folderPath)
          return true
        } catch (e) {
          return false
        }
      },
      async createFolder(parentPath, folderPath) {
        const separator = _.endsWith(parentPath, '/') ? '' : '/'
        const folderExist = await this.isFolderExist(`${parentPath}${separator}${folderPath}`)
        if (!folderExist) await this.gridFsHandler.createNewFolder(parentPath, folderPath)
      }
    },
    provide() {
      return {
        openUploadFileDialog: this.openUploadFileDialog,
        openAndUploadImage: this.openAndUploadImage,
        prepareUploadAppFolder: this.prepareUploadAppFolder,
        uploadImage: this.uploadImage,
        uploadApp: this.uploadApp,
        removeFile: this.removeFile
      }
    }
  }
</script>
<style>
  .file-upload-dialog {
    transform: scale(0.75) translate(100px, 50px);
  }
</style>
