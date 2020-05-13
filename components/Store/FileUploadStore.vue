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
      const gridFsHandler = createGridFsHandlers({
        // namespace: this.$getService('PosStore').accountId,
        apiBaseUrl: '/cms-files'
      })
      
      this.gridFsHandler = new Proxy(gridFsHandler, {
        get: function(obj, prop) {
          if (prop === 'deleteFileByPath') {
            return function(filePath) {
              let path;
              if (filePath.indexOf('//') >= 0)
                path = filePath.substr(filePath.indexOf('//') + 1)
              else
                path = filePath.replace('/cms-files/files/view', '').replace('/cms-files/files/download', '')
              obj['deleteFileByPath'](path);
              cms.sharedConfig && typeof(cms.sharedConfig.purgeCdn) === 'function' && cms.sharedConfig.purgeCdn(filePath);
            }
          }

          // The default behavior to return the value
          return obj[prop];
        }
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
    methods: {
      openUploadFileDialog(callback) {
        openUploadFileDialog({ multiple: false, mimeType: 'image/*' }, files => callback(files[0]))
      },
      uploadImage(file) {
        return new Promise((resolve, reject) => {
          this.showFileUploadProgressDialog = true
          this.uploadingItems.push(this.gridFsHandler.uploadFile(file, '/images', response => {
            if (response.data[0].uploadSuccess) {
              const files = [response.data[0].createdFile]
              resolve(this.gridFsHandler.insertViewUrl(files)[0].viewUrl)
            } else {
              reject(response)
            }
          }, true))
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
              resolve(this.gridFsHandler.insertDownloadUrl(files)[0].downloadUrl)
            } else {
              reject(response)
            }
          }, false))
        })
      },

      async removeFile(filePath) {
        try {
          await this.gridFsHandler.deleteFileByPath(filePath)
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
