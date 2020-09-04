<template>
  <div class="restaurant-info">
    <div class="restaurant-info__title">{{$t('setting.storeInfo')}}</div>
    <div class="restaurant-info__main" v-if="store">
      <div class="restaurant-info__main--left">
        <div>
          <div class="mb-3 fw-700">{{$t('setting.basicInfo')}}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto auto auto auto; grid-gap: 5px">
            <g-text-field-bs large :label="$t('setting.storeName')"
                             :placeholder="$t('setting.storeName')"
                             :value="store.name"
                             @input="updateDebounce({ name: $event })"/>
            <g-text-field-bs large :label="$t('setting.storePhone')"
                             :placeholder="$t('setting.storePhone')"
                             :value="store.phone"
                             @input="updateDebounce({ phone: $event })"/>
            <div class="span-2">
              <p>{{$t('setting.storeAddress')}}</p>
              <g-textarea outlined no-resize placeholder="Address..."
                          :rows="3"
                          :value="store.address"
                          @input="updateDebounce({ address: $event })"/>
            </div>
            <g-text-field-bs large :label="$t('setting.zipCode')"
                             :value="store.zipCode"
                             :hint="coords"
                             @input="updateDebounce({zipCode: $event.trim()})"/>
            <g-text-field-bs large :label="$t('setting.town')"
                             :value="store.townCity"
                             @input="updateDebounce({townCity: $event})"/>
            <g-text-field-bs large :value="store.country.name" :label="$t('setting.country')" readonly/>
            <g-text-field-bs large label="Google My Business Id (Optional)"
                             :value="store.googleMyBusinessId"
                             @input="updateDebounce({googleMyBusinessId: $event})"/>
            <div class="span-2">
              <g-text-field-bs large label="Google My Business Shortcode (Optional)"
                               :value="store.googleMyBusinessShortcode"
                               @input="updateDebounce({googleMyBusinessShortcode: $event})"/>
            </div>
          </div>
        </div>
        <div class="mt-3">
          <div class="mb-3 fw-700">{{$t('setting.embedCode')}}</div>
          <div class="row-flex align-items-center">
            <div style="font-size: 15px; font-weight: 300; font-style: italic; color: #757575">
              {{$t('setting.generateCodeEmbed')}}
            </div>
            <g-spacer/>
            <g-btn-bs min-width="100" style="margin: 0 4px" @click="openDialogGenerate" background-color="#536DFE" text-color="white">{{$t('setting.generate')}}</g-btn-bs>
          </div>
          <template v-if="iframe">
            <g-textarea style="border: 1px solid #EFEFEF;color: #162D3D" rows="3" no-resize :value="iframe"></g-textarea>
            <div class="row-flex align-items-center" style="cursor: pointer">
              <g-icon size="14" color="#536DFE" class="mr-1 mb-1">icon-chain-blue</g-icon>
              <span style="color: #536DFE; cursor: pointer" @click.stop="copyCode">{{$t('setting.copyCode')}}</span>
              <g-spacer/>
            </div>
          </template>
        </div>
      </div>
      <div class="restaurant-info__main--right">
        <div>
          <div class="mb-3 fw-700">{{$t('setting.uploadPhoto')}}</div>
          <div class="mb-5">
            <div class="mb-2">{{$t('setting.storePhoto')}}</div>
            <upload-zone :url="store.orderHeaderImageSrc" @url="update({ orderHeaderImageSrc: $event })" :option="{maxWidth: 500, maxHeight: 500}" :aspect-ratio="2"/>
          </div>
          <div>
            <div class="mb-2">{{$t('setting.storeLogo')}}</div>
            <upload-zone :url="store.logoImageSrc" @url="update({ logoImageSrc: $event })" :option="{maxHeight: 500, maxWidth: 500}"/>
          </div>
        </div>
        <template>
          <div v-if="!store.faviconImageSrc">
            <div class="mb-2 fw-700">{{$t('setting.uploadFavicon')}}</div>
            <div class="row-flex align-items-center">
              <div style="font-size: 15px; font-weight: 300; font-style: italic; color: #757575">
                Upload an icon for your online ordering website
              </div>
              <g-btn-bs style="margin-left: auto; margin-right: auto" @click="choosePhoto" icon="icon-upload_white" background-color="#536DFE" text-color="white">Upload</g-btn-bs>
            </div>
          </div>
          <div v-else class="row-flex align-items-center">
            <div class="mr-2">
              <div class="mb-2 fw-700">{{$t('setting.uploadFavicon')}}</div>
              <div style="font-size: 15px; font-weight: 300; font-style: italic; color: #757575">
                {{$t('setting.faviconMessage')}}
              </div>
            </div>
            <div class="favicon">
              <img alt :src="cdnUrl(store.faviconImageSrc)" style="width: 60px; height: 60px"/>
              <div class="favicon--btn" @click="choosePhoto">
                <g-icon color="#000" size="20">photo_camera</g-icon>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <g-dialog v-model="dialog.generate" width="530" eager>
      <div class="dialog">
        <div style="font-weight: 600; font-size: 22px; margin-bottom: 16px">Generate Embed Code</div>
        <div>
          <p>Choose type</p>
          <div class="row-flex flex-wrap">
            <g-checkbox class="flex-equal" color="#1271ff" v-model="type" :value="{type: 'webshop', link: 'order', order: 2}" label="Online Order"/>
            <g-checkbox class="flex-equal" color="#1271ff" v-model="type" :value="{type: 'reservation', link: 'reservation', order: 3}" label="Reservation"/>
            <g-checkbox class="flex-equal" color="#1271ff" v-model="type" :value="{type: 'overview', link: '', order: 1}" label="Store Overview"/>
          </div>
          <p>Choose position</p>
          <g-radio-group v-model="position" name="position" row>
            <g-radio class="col-3" small color="#1271ff" label="Top Left" value="top-left"/>
            <g-radio class="col-3" small color="#1271ff" label="Middle Left" value="middle-left"/>
            <g-radio class="col-3" small color="#1271ff" label="Bottom Left" value="bottom-left"/>
            <g-radio class="col-3" small color="#1271ff" label="Top Right" value="top-right"/>
            <g-radio class="col-3" small color="#1271ff" label="Middle Right" value="middle-right"/>
            <g-radio class="col-3" small color="#1271ff" label="Bottom Right" value="bottom-right"/>
          </g-radio-group>
          <p>Choose size</p>
          <g-radio-group v-model="size" name="size" row>
            <g-radio class="col-3" small color="#1271ff" label="Small" value="small"/>
            <g-radio class="col-3" small color="#1271ff" label="Normal" value="normal"/>
            <g-radio class="col-3" small color="#1271ff" label="Large" value="large"/>
          </g-radio-group>
          <p style="display: flex; align-items: center; justify-content: space-between">
            Choose an icon
            <g-checkbox color="indigo accent-2" v-model="hidden" label="Hide icon"/>
          </p>
          <g-grid-select id="icon-select" :items="listImage" class="mb-3" v-model="image" return-object style="align-items: stretch; background: rgba(196, 196, 196, 0.2); border: 1px solid #9e9e9e; border-radius: 2px; height: 200px; overflow: auto">
            <template #default="{item, toggleSelect}">
              <div style="border-radius: 2px; padding: 4px; height: 100%; display: flex; align-items: center; cursor: pointer">
                <img alt :src="cdnUrl(item.viewUrl)"@click.stop="toggleSelect(item)"/>
              </div>
            </template>
            <template #selected="{item}">
              <div style="border-radius: 2px; position: relative; padding: 4px; height: 100%; display: flex; align-items: center; ">
                <img alt :src="cdnUrl(item.viewUrl)"/>
                <div style="border-radius: 2px; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.25)">
                  <g-icon color="#1271ff" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 50%">check_circle</g-icon>
                </div>
              </div>
            </template>
          </g-grid-select>
          <div>Or
            <g-btn-bs border-color="#9e9e9e" text-color="#424242" small @click="uploadIcon">Upload</g-btn-bs>
            a new icon<span class="ml-1 fs-small-2 i text-grey">(Only accept jpg, png and svg image type)</span>
          </div>
        </div>
        <div class="row-flex align-items-center justify-end mt-3">
          <g-btn-bs @click="dialog.generate = false" text-color="#424242">Cancel</g-btn-bs>
          <g-btn-bs :disabled="(!hidden && !image) || type.length === 0" @click="updateButton"  background-color="#4CAF50" text-color="white" width="100">Update</g-btn-bs>
          <g-btn-bs :disabled="(!hidden && !image) || type.length === 0" @click="generateCode"  background-color="#536DFE" text-color="white" width="100">Generate</g-btn-bs>
        </div>
      </div>
    </g-dialog>
  </div>
</template>
<script>
  import UploadZone from './UploadZone';
  import _ from 'lodash'
  import {getCdnUrl} from "../../Store/utils";
  import {
    genReadyState,
    genScriptHeader,
    genScriptFooter,
    genStyleSheet,
    checkIOs12AndLess,
    getEmbedBtn,
    mobileCheck,
    genIcon
  } from './gen-embed-script';
  const terser = require('terser')

  // TODO:
  // - remove old image when user change to new image
  // - input debounce

  export default {
    name: 'RestaurantInformation',
    components: { UploadZone },
    props: {
      store: Object
    },
    data: function () {
      return {
        iframe: '',
        image: '',
        libraryImages: {},
        dialog: {
          generate: false
        },
        script: '',
        type: [],
        position: 'bottom-right',
        size: 'normal',
        hidden: false,
      }
    },
    injectService: ['FileUploadStore:(openUploadFileDialog, uploadImage, showFileUploadProgressDialog, uploadingItems, createFolderIfNotExisted, getLibraryImages, removeFile, changeStoreEmbedImage)'],
    computed: {
      coords() {
        if (!this.store.coordinates || !this.store.coordinates.lat || !this.store.coordinates.long) return
        return `Coordinates: ${this.store.coordinates.long}, ${this.store.coordinates.lat}`
      },
      listImage() {
        let list = []
        if(!_.isEmpty(this.libraryImages)) {
          list.push(...this.libraryImages['images'])
          if(this.store && this.store._id && this.libraryImages.hasOwnProperty(this.store._id.toString())) {
            list.push(...this.libraryImages[this.store._id.toString()])
          }
        }
        return list
      },
    },
    async created() {
      this.updateDebounce = _.debounce(this.update, 1000)

      this.libraryImages = await this.getLibraryImages('/images/embed-icon')
    },
    mounted() {
      this.$watch(vm => [vm.store.address, vm.store.townCity , vm.store.zipCode], this.getStoreCoords, { immediate: !this.store.coordinates })
    },
    methods: {
      async update(change) {
        this.$emit('update', change)
      },
      async copyCode() {
        await navigator.clipboard.writeText(this.iframe)
      },
      async choosePhoto() {
        this.openUploadFileDialog(async (file) => {
          const src = await this.uploadImage(file)
          this.$emit('update', {faviconImageSrc: src})
        })
        setTimeout(() => {
          this.showFileUploadProgressDialog = false
          this.uploadingItems = []
        }, 3000)
      },
      cdnUrl(url) {
        return getCdnUrl(url)
      },
      getStoreCoords: _.debounce(async function (value) {
        let [address, city, zipCode] = value
        if (!address || !zipCode) return
        if (city) address += `, ${city}`

        const url = `https://pelias.gigasource.io/v1/search?text=${encodeURI(address)}`

        try {
          const { data: {features} } = await axios.get(url)
          if (features && features.length) {
            const foundLocation = features.find(location => location.properties.postalcode === zipCode)
            if (foundLocation) {
              const [long, lat] = foundLocation.geometry.coordinates
              await this.update({ coordinates: { long, lat }, location: { type: 'Point', coordinates: [long, lat] }})
              console.log(`[Geocode]${this.store.alias}|PeliasAPI|coords:${long}, ${lat}`)
            } else {
              await this.getCoordsByGoogleApi(zipCode, address)
            }
          }
        } catch (e) {
          console.warn(e)
          await this.getCoordsByGoogleApi(zipCode, address)
        }

      }, 500),
      async getCoordsByGoogleApi(code, address) {
        cms.socket.emit('getCoordsByGoogleApi', code, address, async (coordinates) => {
          if (coordinates) {
            const { long, lat } = coordinates
            console.log(`[Geocode]${this.store.alias}|GoogleAPI|coords:${long}, ${lat}`)
            await this.update({ coordinates: {long, lat} })
          } else {
            console.log(`[Geocode]${this.store.alias}|GoogleAPI|coords:${coordinates}`)
            await this.update({ coordinates })
          }
        })
      },
      openDialogGenerate() {
        this.image = null
        this.dialog.generate = true
      },
      async uploadIcon() {
        if(!this.store || !this.store._id) return
        this.openUploadFileDialog(async (file) => {
          await this.createFolderIfNotExisted('/images/embed-icon/', this.store._id.toString())
          const src = await this.uploadImage(file, `/images/embed-icon/${this.store._id.toString()}`)
          this.libraryImages = await this.getLibraryImages('/images/embed-icon')
          this.image = this.listImage.find(img => img.viewUrl === src)
          //close dialog upload
          this.showFileUploadProgressDialog = false
          this.uploadingItems = []
          //scroll to new uploaded icon
          const wrapper = document.getElementById('icon-select')
          wrapper.scroll({top: wrapper.scrollHeight})
        })
      },
      async generateCode() {
        await this.updateButton()
        const origin = location.origin.includes('online-order') || location.origin.includes('8888') ? location.origin : 'https://cdn.restaurantplus.net'
        const script = `var turn = 0;
                  function finishLoad() {
                    turn = 100;
                    console.log('finished loading script');
                  }
                  function load() {
                    console.log('load script turn ' + (turn + 1));
                    if(turn < 100) {
                      turn++;
                      var head = document.getElementsByTagName('head')[0];
                      var oldScript = document.querySelector('script.restaurant-plus-embed-script');
                      if(oldScript) head.removeChild(oldScript);
                      var script= document.createElement('script');
                      script.src = '${origin + this.script}';
                      script.onload = finishLoad;
                      script.onerror = load;
                      script.async = true;
                      script.classList.add('restaurant-plus-embed-script');
                      head.appendChild(script);
                    }
                  }
                  load()`
        this.iframe = `<script type="application/javascript">
                  ${terser.minify(script).code}
                <\/script>`
        this.dialog.generate = false
      },
      async updateButton(close = false) {
        //change image
        if(this.image) await this.changeStoreEmbedImage(this.image, `/store/${this.store.alias}/`, 'embed')
        //change script
        const header = genScriptHeader(),
            footer = genScriptFooter(),
            triggerBtn = getEmbedBtn(_.orderBy(this.type, 'order'), this.store.alias),
            checkIOs = checkIOs12AndLess(),
            mobile = mobileCheck(),
            icon = genIcon(this.store.alias, this.image.mimeType, this.image.fileName.split('.')[1], 'https://cdn.restaurantplus.net')
        const fnString = header + checkIOs + mobile + genStyleSheet(this.position, this.size, this.hidden) + icon + triggerBtn + genReadyState() + footer
        const minifyString = terser.minify(fnString).code
        const file = new File([minifyString], `embed-script.js`, {type: 'text/javascript'})
        this.script = await this.$getService('FileUploadStore').uploadScript(file, this.store.alias)
        if(close) this.dialog.generate = false
      }
    }
  }
</script>

<style scoped lang="scss">
  .restaurant-info {
    font-size: 15px;
    overflow: auto;
    height: 100%;

    &__title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    &__main {
      display: flex;

      &--left,
      &--right {
        flex: 0 0 calc(50% - 12px);

        .span-2 {
          grid-column: span 2;
        }

        & > div {
          background-color: #FFF;
          border-radius: 5px;
          padding: 24px;
          margin-bottom: 24px;
        }
      }

      &--left {
        margin-right: 12px;
      }

      &--right {
        margin-left: 12px;
      }

      .g-textarea {
        margin: 4px 4px 4px 0;
        width: calc(100% - 5px);

        ::v-deep .g-tf {
          &:before, &:after {
            display: none;
          }
        }

        ::v-deep fieldset {
          border-width: 1px !important;
          border-color: #ced4da;

          &:focus-within {
            border-color: #80bdff !important;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
            z-index: 2;
          }

          .g-tf-input {
            padding: 12px;
            font-size: 15px;
          }

          .g-tf-append__inner {
            display: none;
          }

          textarea {
            user-select: text !important;
            max-height: 100px;
          }
        }
      }

      .g-select ::v-deep .bs-tf-label {
        font-size: 15px;
      }

      .bs-tf-wrapper ::v-deep .bs-tf-label {
        margin-bottom: 4px;
      }

      .favicon {
        position: relative;
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 2px 0 5px rgba(0, 0, 0, 0.15);
        border-radius: 4px;
        margin-left: auto;
        margin-right: auto;

        &--btn {
          position: absolute;
          bottom: -16px;
          right: -16px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #EFEFEF;
          box-shadow: 1px 0 3px rgba(0, 0, 0, 0.40);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
      }
    }
  }

  .dialog {
    background: white;
    padding: 24px;
    width: 100%;
    border-radius: 4px;

    ::v-deep .g-radio-group__horizontal {
      display: flex;
      flex-wrap: wrap;
    }
  }
</style>
