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

      await this.createFolderIfNotExisted('/', 'images')
      await this.createFolderIfNotExisted('/', 'update')
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
        await this.createFolderIfNotExisted('/update', groupName)
        await this.createFolderIfNotExisted(`/update/${groupName}`, version)
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
      async createFolderIfNotExisted(folderPath, folderName) {
        const folderExisted = await this.gridFsHandler.checkFileExisted(folderPath, folderName);
        if (!folderExisted) await this.gridFsHandler.createNewFolder(folderPath, folderName)
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
