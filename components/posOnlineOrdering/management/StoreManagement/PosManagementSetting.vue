<template>
  <div class="pos-management-setting">
    <!-- BASIC INFO -->
    <div class="pos-management-setting__info">
      <div class="pos-management-setting__title">Basic Information</div>
      <g-select large deletable-chips multiple text-field-component="GTextFieldBs" label="Group"
                :items="groups" class="group"
                item-text="name"
                item-value="_id"
                v-model="computedGroup"/>
      <g-text-field-bs large label="Name" v-model="computedSettingName"/>
      <g-text-field-bs large label="Address" v-model="computedSettingAddress"/>
      <g-text-field-bs large label="Country" :value="countryName" readonly/>
    </div>

    <!-- ONLINE ORDER STORE -->
    <div class="pos-management-setting__order">
      <div class="pos-management-setting__title">Online Ordering</div>
      <div>
        <p>Online ordering</p>
        <g-radio-group v-model="computedOnlineOrdering" row>
          <g-radio color="#536DFE" label="Active" value="1"/>
          <g-radio color="#536DFE" label="In-active" value="0"/>
        </g-radio-group>
      </div>
      <div>
        <p>WebShop URL</p>
        <div class="pos-management-setting__order--url r">
          <span class="i text-indigo-accent-2">{{ webShopUrlPrefix }}</span>
          <div style="flex: 1; margin-left: 8px">
            <g-text-field-bs dense :class="[aliasErrMessage && 'error']" large :placeholder="_id" :value="alias" @input="updateAliasDebounce"/>
          </div>
          <div v-if="aliasErrMessage" class="error-message">{{aliasErrMessage}}</div>
        </div>
      </div>
      <div class="r">
        <p>Client's domain</p>
        <g-text-field-bs large :class="[clientDomainErrMessage && 'error']" :value="clientDomain" @input="updateClientDomainDebounce"/>
        <div v-if="clientDomainErrMessage" class="error-message">{{clientDomainErrMessage}}</div>
      </div>
      <div v-if="clientDomain" class="mt-3">
        <div class="mb-3 fw-700">{{$t('setting.embedCode')}}</div>
        <div class="row-flex align-items-center">
          <div style="font-size: 15px; font-weight: 300; font-style: italic; color: #757575">
            {{$t('setting.generateCodeEmbed')}}
          </div>
          <g-spacer/>
          <g-btn-bs min-width="100" style="margin: 0 4px" @click="dialog.generate = true" background-color="#536DFE" text-color="white">{{$t('setting.generate')}}</g-btn-bs>
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

      <g-dialog v-model="dialog.generate" width="530" eager>
        <div class="dialog">
          <div style="font-weight: 600; font-size: 22px; margin-bottom: 16px">Generate Embed Code</div>
          <div>
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
            <g-btn-bs :disabled="(!hidden && !image)" @click="generateCode"  background-color="#536DFE" text-color="white" width="100">Generate</g-btn-bs>
          </div>
        </div>
      </g-dialog>
    </div>

    <!-- DEVICES -->
<!--    <div class="pos-management-setting__device">-->
<!--      <div class="pos-management-setting__title">Device status</div>-->
<!--      <template v-if="devices.length === 0">-->
<!--        <div class="pos-management-setting__device&#45;&#45;empty">-->
<!--          <img alt src="/plugins/pos-plugin/assets/empty_group.svg"/>-->
<!--          <p class="text-grey-darken-1 mb-2 mt-2">Device is currently empty.</p>-->
<!--          <div class="text-indigo-accent-2" style="cursor: pointer" @click="$emit('open:dialogDevice', true)">-->
<!--            <g-icon style="margin-bottom: 4px; margin-right: -4px" size="18" color="indigo-accent-2">add</g-icon>-->
<!--            Add New Device-->
<!--          </div>-->
<!--        </div>-->
<!--      </template>-->
<!--      <template v-else>-->
<!--        <div class="pos-management-setting__device-content">-->
<!--          <div class="pos-management-setting__device-content&#45;&#45;add">-->
<!--            <g-icon color="indigo-accent-2" size="60">add</g-icon>-->
<!--            <p class="text-indigo-accent-2">Add New Device</p>-->
<!--          </div>-->
<!--          <div v-for="device in devices">-->
<!--            <p class="fw-700 mb-2">Name</p>-->
<!--            <p class="mb-1">Device type: {{device.type}}</p>-->
<!--            <p class="mb-1">OS: {{device.os}}</p>-->
<!--            <p class="mb-1">Status: {{device.status}}</p>-->
<!--            <g-btn-bs elevation="2" text-color="#757575">Disable</g-btn-bs>-->
<!--            <div class="pos-management-setting__device-content&#45;&#45;action">-->
<!--              <g-tooltip :open-on-hover="true" right speech-bubble color="#000" transition="0.3" remove-content-on-close>-->
<!--                <template v-slot:activator="{on}">-->
<!--                  <div class="pos-management-setting__device-content&#45;&#45;action-btn mt-1"-->
<!--                       @mouseenter="on.mouseenter"-->
<!--                       @mouseleave="on.mouseleave"-->
<!--                       @click.stop.prevent="$emit('open:dialogDelete', device)">-->
<!--                    <g-icon color="#FFF" small>mdi-trash-can-outline</g-icon>-->
<!--                  </div>-->
<!--                </template>-->
<!--                <span>Delete</span>-->
<!--              </g-tooltip>-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->
<!--      </template>-->
<!--    </div>-->
  </div>
</template>

<script>
  import _ from 'lodash'
  import {
    checkIOs12AndLess,
    genIcon,
    genReadyState,
    genScriptFooter,
    genScriptHeader, genStyleSheet,
    getEmbedBtn,
    mobileCheck
  } from "../../settings/gen-embed-script";
  import {getCdnUrl} from "../../../Store/utils";
  const terser = require('terser')

  export default {
    name: "PosManagementSetting",
    props: {
      _id: String,
      settingName: String,
      group: null,
      settingAddress: String,
      onlineOrdering: Boolean,
      alias: String,
      clientDomain: String,
      devices: Array,
      groups: Array,
      country: Object,
    },
    injectService: ['PosOnlineOrderManagementStore:(stores)',
                    'FileUploadStore:(openUploadFileDialog, uploadImage, showFileUploadProgressDialog, uploadingItems, createFolderIfNotExisted, getLibraryImages, removeFile, changeStoreEmbedImage)'],
    data() {
      return {
        aliasErrMessage: '',
        clientDomainErrMessage: '',
        countryName: this.country && this.country.name || '',
        groupIds: this.group && this.group.map(g => g._id) || [],
        dialog: {
          generate: false,
        },
        iframe: '',
        image: '',
        libraryImages: {},
        script: '',
        position: 'bottom-right',
        size: 'normal',
        hidden: false,
      }
    },
    async created() {
      this.updateDebounce = _.debounce(this.update, 1000)
      this.updateAliasDebounce = _.debounce(this.updateAlias, 1000)
      this.updateClientDomainDebounce = _.debounce(this.updateClientDomain, 1000)

      this.libraryImages = await this.getLibraryImages('/images/embed-icon')
    },
    computed: {
      webShopUrlPrefix() {
        return`${location.host}/store/`
      },
      computedGroup: {
        get() {
          return this.groupIds
        },
        set(val) {
          this.update({ groups: val })
          this.groupIds = val
        }
      },
      computedSettingName: {
        get() {
          return this.settingName
        },
        set(val) {
          this.updateDebounce({ settingName: val })
        }
      },
      computedSettingAddress: {
        get() {
          return this.settingAddress
        },
        set(val) {
          this.updateDebounce({ settingAddress: val })
        }
      },
      computedOnlineOrdering: {
        get() {
          return this.onlineOrdering ? "1" : "0"
        },
        set(value) {
          this.updateDebounce({ onlineOrdering: value === "1" })
        }
      },
      computedCountry: {
        get() {
          return this.countryName
        },
        set(val) {
          this.update({country: val})
          this.countryName = val.name
        }
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
    methods: {
      async storeAliasValid(alias) {
        if (_.trim(alias) === '') {
          this.aliasErrMessage = 'WebShop url must not empty!!'
          return false
        }
        if (/([^a-zA-Z0-9\-])/g.exec(alias)) {
          this.aliasErrMessage = 'Valid characters are a-z, A-Z, 0-9 and \'-\' character'
          return false
        }
        const res = (await axios.post('/store/validate-alias', { store: this._id, alias })).data
        if (!res.ok) {
          this.aliasErrMessage = res.message
          return false
        }
        return true
      },
      async updateAlias(value) {
        this.aliasErrMessage = ''
        if (await this.storeAliasValid(value))
          this.update({ alias: value })
      },
      async clientDomainValid(clientDomain) {
        this.clientDomainErrMessage = ''
        if(clientDomain.includes(' ')) {
          this.clientDomainErrMessage = 'Client Domain must not have space in it!'
          return false
        }
        // allow dupplicate client domain to create franchise
        // const res = (await axios.post('/store/validate-client-domain', { store: this._id, clientDomain })).data
        // if (!res.ok) {
        //   this.clientDomainErrMessage = res.message
        //   return false
        // }
        return true
      },
      async updateClientDomain(value) {
        if (await this.clientDomainValid(value))
          this.update({clientDomain: value})
      },
      update(change) {
        this.$emit('update', change)
      },
      cdnUrl(url) {
        return getCdnUrl(url)
      },
      async uploadIcon() {
        if(!this.store || !this.store._id) return
        this.openUploadFileDialog(async (file) => {
          await this.createFolderIfNotExisted('/images/embed-icon/', this.clientDomain)
          const src = await this.uploadImage(file, `/images/embed-icon/${this.clientDomain}`)
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
        //change image
        if(this.image) await this.changeStoreEmbedImage(this.image, `/store/${this.clientDomain}/`, 'embed')
        //change script
        const header = genScriptHeader(),
            footer = genScriptFooter(),
            triggerBtn = getEmbedBtn({type: 'franchise', id: 'restaurant-plus-franchise-btn'}, this.clientDomain),
            checkIOs = checkIOs12AndLess(),
            mobile = mobileCheck(),
            icon = genIcon(this.clientDomain, this.image.mimeType, this.image.fileName.split('.')[1], 'https://cdn.restaurantplus.net', 'restaurant-plus-franchise-btn')
        const fnString = header + checkIOs + mobile + genStyleSheet(this.position, this.size, this.hidden, 'restaurant-plus-franchise-btn') + icon + triggerBtn + genReadyState() + footer
        const minifyString = terser.minify(fnString).code
        const file = new File([minifyString], `embed-script.js`, {type: 'text/javascript'})
        this.script = await this.$getService('FileUploadStore').uploadScript(file, this.clientDomain)
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
      async copyCode() {
        await navigator.clipboard.writeText(this.iframe)
      },
    }
  }
</script>

<style scoped lang="scss">
  .pos-management-setting {
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr 1fr;
    grid-gap: 20px;
    height: calc(100% - 50px);

    & > div {
      background: white;
      border-radius: 4px;
      padding: 24px
    }

    &__title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    &__info {
      grid-area: 1/1/2/2;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .group ::v-deep .bs-tf-inner-input-group {
        overflow: auto;

        .input {
          width: calc(100% - 24px);
        }
      }
    }

    &__order {
      grid-area: 1/2/2/3;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      &--url {
        display: flex;
        align-items: center;
      }

      .error-message {
        position: absolute;
        bottom: -4px;
        right: 8px;
        color: #ff4452;
        font-size: 12px;
        font-style: italic;
      }

      .error ::v-deep {
        .bs-tf-input-group {
          .bs-tf-inner-input-group {
            border-color: #ff4452 !important;
            box-shadow: 0 0 0 3px rgba(233, 0, 0, 0.25)
          }
        }
      }
    }

    &__device {
      grid-area: 1/2/3/3;

      &--empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-items: center;
        margin-top: 96px;
      }

      &-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-auto-rows: 1fr;
        grid-gap: 16px;

        & > div {
          border-radius: 2px;
          background: #FAFAFC;
          border: 1px solid #EFEFEF;
          padding: 12px 16px;
          position: relative;
        }

        &--add {
          border: 2px dashed #BBDEFB !important;
          background: white !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        &--action {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          flex-direction: column;

          &-btn {
            background: #616161;
            border-radius: 2px;
            width: 25px;
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;

            &:hover {
              background: #536DFE;
            }
          }
        }

        .g-btn-bs {
          display: block;
          margin-top: 8px;
        }
      }
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
