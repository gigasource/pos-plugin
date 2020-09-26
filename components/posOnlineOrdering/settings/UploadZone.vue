<template>
  <div class="upload-zone">
    <slot v-bind:showUploadDialog="showUploadDialog">
      <div v-if="url" style="height: 244px; display: flex; align-items: center; justify-content: center">
        <img :src="cdnUrl" class="uploaded-image" draggable="false"/>
        <g-btn-bs @click="showUploadDialog()" class="edit-image-btn" text-color="#424242" background-color="#FFF" :elevation="elevation">
          <g-icon>photo_camera</g-icon>
          <span style="margin-left: 4px">Edit Photo</span>
        </g-btn-bs>
      </div>

      <div v-else @click="showUploadDialog()" style="padding: 20px; height: 244px">
        <div style="display: flex; align-items: center">
          <img src="/plugins/pos-plugin/assets/img.svg" class="mr-2">
          <div>
            <div class="upload-zone__subtext fw-700">One high resolution image</div>
            <div class="upload-zone__subtext text-grey">PNG, JPG</div>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; padding-top: 30px;">
          <img src="/plugins/pos-plugin/assets/upload.svg" class="mb-2">
          <div class="upload-zone__title">Drag and drop an image</div>
          <div>or <span style="color: #2873f2">browse</span> to choose file</div>
          <div class="upload-zone__subtext text-grey">(430x200 or larger recommended, up to 10MB each)</div>
        </div>
      </div>
    </slot>
    <!-- -->
    <g-dialog v-model="dialog.upload" persistent>
      <div class="dialog-upload">
        <!-- src -->
        <div class="dialog-upload__title">Upload Photo</div>
        <template v-if="view === 'src'">
          <div style="margin-bottom: -1px;">
            <span @click="tab = 'upload'" :class="['dialog-upload__tab', tab === 'upload' && 'dialog-upload__tab--selected']" style="marginLeft: 35px">Upload a photo</span>
            <span @click="tab = 'url'" :class="['dialog-upload__tab', tab === 'url' && 'dialog-upload__tab--selected']">Paste Photo Url</span>
            <span @click="tab = 'library'" :class="['dialog-upload__tab', tab === 'library' && 'dialog-upload__tab--selected']">Select from library</span>
          </div>
          <div style="border: 1px solid #9E9E9E; background-color: #EFEFEF; padding: 36px; border-radius: 0 0 5px 5px">
            <template v-if="tab === 'url'">
              <g-text-field-bs v-model="photoUrl" label="Photo URL"/>
            </template>
            <template v-else-if="tab === 'upload'">
              <div style="height: 70px; display: flex; align-items: center; width: 100%; overflow: hidden">
                <g-btn-bs @click="choosePhoto" background-color="#FFF" border-color="#C4C4C4" text-color="#424242" width="150">Choose Photo</g-btn-bs>
                <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{ fileName }}</div>
              </div>
            </template>
            <template v-else>
              <div>
                <div class="row-flex align-items-center mb-2">
                  <div class="fw-700 fs-small mr-2">Group</div>
                  <g-select text-field-component="GTextFieldBs" small v-model="libraryGroup" :items="libraryGroups"/>
                </div>
                <g-grid-select :items="library" class="mb-3 no-gutters" v-model="image" item-cols="2" return-object style="background: rgba(196, 196, 196, 0.2); border-radius: 4px; height: 200px; overflow: auto">
                  <template #default="{item, toggleSelect}">
                    <div style="border: 1px solid transparent; border-radius: 2px; padding: 4px">
                      <img alt :src="getImageUrl(item.viewUrl)" style="width: 100px; height: 100px" @click.stop="toggleSelect(item)"/>
                    </div>
                  </template>
                  <template #selected="{item}">
                    <div style="border: 1px solid #1271ff; border-radius: 2px; position: relative; padding: 4px">
                      <img alt :src="getImageUrl(item.viewUrl)" style="width: 100px; height: 100px"/>
                      <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.25)">
                        <g-icon color="#1271ff" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 50%">check_circle</g-icon>
                      </div>
                    </div>
                  </template>
                </g-grid-select>
              </div>
            </template>
            <div style="display: flex; justify-content: flex-end; margin-top: 24px">
              <g-btn-bs width="90" height="44" @click="closeDialog">Cancel</g-btn-bs>
              <g-btn-bs :disabled="invalidImage" @click="moveToCropView" background-color="#536DFE" width="98" height="44" text-color="#FFF">Next</g-btn-bs>
            </div>
          </div>
        </template>
        <!-- crop -->
        <template v-else>
          <div style="text-align: center; background: #EFEFEF; ">
            <div v-if="loadingImage">Loading image...</div>
            <div v-if="initializingCropper">Preparing cropper...</div>
            <img :src="imageSrc" :style="`height: ${cropBoxHeight}px`" ref="previewImage" @load="imageLoaded">
          </div>
          <div style="display: flex; justify-content: flex-end; padding: 35px;">
            <g-btn-bs width="90" height="44" @click="moveToSrcView">Back</g-btn-bs>
            <g-btn-bs :disabled="initializingCropper || dialog.uploading" background-color="#536DFE" text-color="#FFF" width="98" height="44" @click="_uploadImage">Save</g-btn-bs>
          </div>
        </template>
      </div>
    </g-dialog>
  </div>
</template>
<script>
  const Cropper = () => import('cropperjs');
  import { getCdnUrl } from '../../Store/utils';

  export default {
    name: 'UploadZone',
    props: {
      url: String,
      elevation: {
        type: Number,
        default: 2
      },
      option: Object,
      aspectRatio: Number
    },
    data: function () {
      return {
        view: 'src', // src | crop
        tab: 'upload', // url | upload

        // via link
        loadingImage: false,
        photoUrl: '',

        // via file
        file: null,

        // cropper
        cropper: null,
        initializingCropper: false,
        cropBoxHeight: 281,

        //
        dialog: {
          upload: false,
          uploading: false,
        },
        libraryGroup: 'All',
        image: null,
        libraryImages: {}
      }
    },
    injectService: ['FileUploadStore:(openUploadFileDialog, uploadImage, showFileUploadProgressDialog, uploadingItems, getLibraryImages)'],
    async created() {
      this.libraryImages = await this.getLibraryImages('/images/library')
    },
    computed: {
      fileName() {
        return this.file ? this.file.name : 'No file chosen'
      },
      isExternalFile() {
        // external file is file which starts with http
        // internal file is file which hosted by grid fs and starts with /cmsfiles
        return this.photoUrl.startsWith('http')
      },
      imageSrc() {
        if (this.tab === 'url') {
          return this.isExternalFile ? `/store/upload-zone/prepare?url=${this.photoUrl}` : this.photoUrl
        } else if (this.tab === 'upload') {
          // upload from file
          return URL.createObjectURL(this.file)
        } else {
          return this.image.viewUrl
        }
      },
      cdnUrl() {
        return getCdnUrl(this.url)
      },
      libraryGroups() {
        const groups = Object.keys(this.libraryImages).filter(key => key !== 'images')
        return ['All', ...groups]
      },
      library() {
        if(this.libraryGroup === 'All') {
          return _.flatten(_.map(this.libraryImages, lib => [...lib]))
        }
        return this.libraryImages[this.libraryGroup]
      },
      invalidImage() {
        if(this.tab === 'url') {
          return !this.photoUrl
        } else if (this.tab === 'upload') {
          return !this.file
        } else if (this.tab === 'library') {
          return !this.image
        } else {
          return true
        }
      }
    },
    methods: {
      showUploadDialog(view = 'src') {
        this.dialog.upload = true
        this.view = view
        this.tab = 'upload'
        this.photoUrl = ''
        this.file = null
      },
      moveToSrcView() {
        this.view = 'src'
        // remove cropper
        this.cropper && this.cropper.destroy()
      },
      moveToCropView() {
        this.view = 'crop'
        this.loadingImage = true
        this.initializingCropper = true
      },
      imageLoaded() {
        this.loadingImage = false
        this.$nextTick(async () => {
          const image = this.$refs.previewImage
          if (!image) return
          const { width, height } = image
          const minCropBoxHeight = width >= height ? this.cropBoxHeight : Math.floor(this.cropBoxHeight * width / height)
          const cropperCtor = (await Cropper()).default
          const cropper = new cropperCtor(image, {
            aspectRatio: this.aspectRatio,
            responsive: true,
            // minCropBoxHeight: minCropBoxHeight,
            autoCropArea: 1
          });
          this.$set(this, 'cropper', cropper)
          this.initializingCropper = false
        })
      },
      closeDialog() {
        this.cropper && this.cropper.destroy()
        this.dialog.upload = false
      },
      choosePhoto() {
        this.openUploadFileDialog(file => this.file = file)
      },
      updateImageUrl(url) {
        console.log('update url:', url)
        this.$emit('url', url)
      },
      async _uploadImage() {
        this.dialog.uploading = true
        const options = {
          imageSmoothingEnabled: false,
          ... this.option
        }
        try {
          this.cropper.getCroppedCanvas(options).toBlob(async (blob) => {
            let uploadedUrl
            if (this.tab === 'url') {
              const fileName = this.photoUrl.substr(this.photoUrl.lastIndexOf('/') + 1)
              const fileExt = fileName.substr(fileName.lastIndexOf('.') + 1)
              let mimeType;
              switch (fileExt) {
                case 'png':
                  mimeType = 'image/png';
                  break;
                case 'jpg':
                case 'jpeg':
                  mimeType = 'image/jpeg';
                  break;
                case 'svg':
                  mimeType = 'image/svg+xml';
                  break;
                case 'gif':
                  mimeType = 'image/gif';
                  break;
                default:
                  mimeType = 'image/*'
              }
              uploadedUrl = await this.uploadImage(new File([blob], fileName, { type: mimeType }), this.updateImageUrl)
            } else if (this.tab === 'upload') {
              uploadedUrl = await this.uploadImage(new File([blob], this.file.name, { type: this.file.type }), this.updateImageUrl)
            } else {
              const fileName = this.image.viewUrl.substr(this.image.viewUrl.lastIndexOf('/') + 1)
              const fileExt = fileName.substr(fileName.lastIndexOf('.') + 1)
              let mimeType;
              switch (fileExt) {
                case 'png':
                  mimeType = 'image/png';
                  break;
                case 'jpg':
                case 'jpeg':
                  mimeType = 'image/jpeg';
                  break;
                case 'svg':
                  mimeType = 'image/svg+xml';
                  break;
                case 'gif':
                  mimeType = 'image/gif';
                  break;
                default:
                  mimeType = 'image/*'
              }
              uploadedUrl = await this.uploadImage(new File([blob], fileName, { type: mimeType }), this.updateImageUrl)
            }
            this.updateImageUrl(uploadedUrl)
            this.dialog.uploading = false
            setTimeout(() => {
              this.showFileUploadProgressDialog = false
              this.uploadingItems = []
            }, 3000)
          })
        } catch(e) {
          this.dialog.uploading = false
        }
        this.closeDialog()
      },
      getImageUrl(url) {
        return getCdnUrl(url)
      },
      selectImage(image) {
        this.image = image
      }
    }
  }
</script>

<style scoped lang="scss">
  .upload-zone {
    border: 1px dashed #9E9E9E;
    border-radius: 2px;
    cursor: pointer;
    overflow: hidden;
    position: relative;

    &:hover {
      background-color: #FAFAFA;
    }

    .uploaded-image {
      display: block;
      margin-left: auto;
      margin-right: auto;
      max-width: 100%;
      max-height: 100%;
    }

    .edit-image-btn {
      position: absolute;
      right: 20px;
      bottom: 20px;
    }

    &__subtext {
      font-size: 12px;
      line-height: 11px;
    }

    &__title {
      font-size: 18px;
      font-weight: 900;
    }
  }

  .bs-tf-wrapper ::v-deep .bs-tf-inner-input-group {
    background: white;
  }

  .dialog-upload {
    width: 680px;
    background-color: #FFF;
    border-radius: 5px;
    margin: 0 auto;

    &__title {
      font-weight: 600;
      font-size: 24px;
      color: #212121;
      padding: 36px;
    }

    &__tab {
      display: inline-block;
      font-weight: 700;
      font-size: 15px;
      padding: 8px 10px;
      border-radius: 2px 2px 0 0;
      border-bottom: 1px solid #9E9E9E;
      cursor: pointer;

      &--selected {
        border: 1px solid #9E9E9E;
        border-bottom: 1px solid transparent;
        background: #EFEFEF;
      }
    }

    .g-select {
      flex: 0 0 40%;

      ::v-deep {
        .bs-tf-wrapper {
          margin: 0;
          background: #FFFFFF;

          .bs-tf-inner-input-group {
            height: 30px;

            .bs-tf-input {
              padding: 0
            }
          }
        }
      }
    }
  }
</style>
<style lang="scss">
  @import "~cropperjs/src/index.scss";
</style>
