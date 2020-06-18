<template>
  <g-dialog v-model="internalValue" width="531">
    <div class="dialog">
      <div class="dialog__title">Import Menu Item</div>
      <div class="dialog__content col-flex">
        <div class="row-flex align-items-center mb-3">
          <g-btn-bs @click="loadMenuItemDataFile" class="ml-0" border-color="#414141">Choose File</g-btn-bs>
          <div class="ml-2" style="max-width: 230px;">{{ fileName }}</div>
        </div>
        <g-select text-field-component="GTextFieldBs" v-model="importBehavior" :items="importBehaviors" label="Import Behavior"/>
        <g-spacer/>
        <div class="row-flex justify-end">
          <g-btn-bs @click="close">Cancel</g-btn-bs>
          <g-btn-bs background-color="#536dfe" text-color="#FFF" @click="importFile">Import</g-btn-bs>
        </div>
      </div>
    </div>
  </g-dialog>
</template>
<script>
  import openUploadFileDialog from 'vue-file-explorer/api-handlers/openUploadFileDialog'
  
  export default {
    name: 'dialogImportMenuItem',
    props: {
      value: Boolean,
    },
    data: function () {
      return {
        file: null,
        importBehavior: 'wipeOutOldData',
        importBehaviors: [{ text: 'Wipe Out Old Data', value: 'wipeOutOldData' }]
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(v) {
          this.$emit('input', v)
        }
      },
      fileName() {
        return this.file ? this.file.name: ''
      }
    },
    methods: {
      close() {
        this.internalValue = false
      },
      loadMenuItemDataFile() {
        // https://stackoverflow.com/questions/974079/setting-mime-type-for-excel-document
        openUploadFileDialog({
          multiple: false,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }, files => {
          this.file = files[0]
        })
      },
      importFile() {
        const metadata = {
          file: this.file,
          importBehavior: this.importBehavior
        }
        
        const callback = (isCompleted, error) => {
          if (isCompleted) {
            this.close()
          } else {
            alert('Import failed. See console log for more information')
            console.dir(error)
          }
        }
        
        this.$emit('submit', metadata, callback)
      }
    }
  }
</script>
<style scoped lang="scss">
  .dialog {
    background: white;
    border-radius: 4px;
    width: 100%;
    position: relative;
    padding: 40px;
  
    &__title {
      color: #212121;
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 28px;
      margin-left: 4px;
    }
    
    &__content {
    
    }
  }
</style>
