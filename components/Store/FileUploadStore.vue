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
        apiBaseUrl: '/cms-files',
        imageThumbnailSize: {}
      })
      
      await this.createFolderIfNotExisted('/', 'images')
      await this.createFolderIfNotExisted('/', 'update')

      this.libraryImages = await this.getLibraryImages('/images/library')
    },
    data() {
      return {
        uploadingItems: [],
        showFileUploadProgressDialog: false,
        libraryImages: {}
      }
    },
    methods: {
      openUploadFileDialog(callback) {
        openUploadFileDialog({ multiple: false, mimeType: 'image/*' }, files => callback(files[0]))
      },
      uploadImage(file, path = '/images') {
        return new Promise((resolve, reject) => {
          this.showFileUploadProgressDialog = true
          this.uploadingItems.push(this.gridFsHandler.uploadFile(file, path, response => {
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
          let path;
          if (filePath.indexOf('//') >= 0)
            path = filePath.substr(filePath.indexOf('//') + 1)
          else
            path = filePath.replace('/cms-files/files/view', '').replace('/cms-files/files/download', '')
          await this.gridFsHandler.deleteFileByPath(path)
          if (cms.sharedConfig && typeof(cms.sharedConfig.getPurgeCdnData) === 'function') {
            const purgeCdnData = cms.sharedConfig.getPurgeCdnData(path);
            if (purgeCdnData)
              axios.get(purgeCdnData.url, purgeCdnData.options)
          }
        } catch (e) {}
      },
      async createFolderIfNotExisted(folderPath, folderName) {
        const folderExisted = await this.gridFsHandler.checkFileExisted(folderPath, folderName);
        if (!folderExisted) await this.gridFsHandler.createNewFolder(folderPath, folderName)
      },
      async getLibraryImages(path) {
        const files = await this.gridFsHandler.getFilesInPath(path)
        let images = files.filter(f => !f.isFolder && f.mimeType.startsWith('image')), library = {images}
        const folders = files.filter(f => f.isFolder)
        for(const folder of folders) {
          const folderFiles = await this.gridFsHandler.getFilesInPath(folder.folderPath.concat(folder.fileName))
          const folderImages = folderFiles.filter(f => !f.isFolder && f.mimeType.startsWith('image'))
          library[folder.fileName] = folderImages
        }
        return library
      }
    },
    provide() {
      return {
        openUploadFileDialog: this.openUploadFileDialog,
        prepareUploadAppFolder: this.prepareUploadAppFolder,
        uploadImage: this.uploadImage,
        uploadApp: this.uploadApp,
        removeFile: this.removeFile,
        libraryImages: this.libraryImages,
        getLibraryImages: this.getLibraryImages,
        createFolderIfNotExisted: this.createFolderIfNotExisted,
      }
    }
  }
</script>
<style>
  .file-upload-dialog {
    transform: scale(0.75) translate(100px, 50px);
  }
</style>
