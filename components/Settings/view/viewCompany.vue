<template>
  <fragment>
    <div class="main">
      <div class="main__item">
        <g-text-field-bs :label="$t('settings.companyName')" v-model="name" required>
          <template v-slot:append-inner>
            <g-icon style="cursor: pointer" @click.stop="dialog = true">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
      </div>
      <div class="main__item">
        <g-text-field-bs :label="$t('settings.address')" v-model="address" required>
          <template v-slot:append-inner>
            <g-icon style="cursor: pointer" @click.stop="dialog = true">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
      </div>
      <div class="main__item">
        <g-text-field-bs :label="$t('settings.address2')" v-model="address2">
          <template v-slot:append-inner>
            <g-icon style="cursor: pointer" @click.stop="dialog = true">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
      </div>
      <div class="main__item">
        <g-text-field-bs :label="$t('settings.zipCode')" v-model="zipCode" required>
          <template v-slot:append-inner>
            <g-icon style="cursor: pointer" @click.stop="dialog = true">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
      </div>
      <div class="main__item">
        <g-text-field-bs :label="$t('settings.city')" v-model="city" required>
          <template v-slot:append-inner>
            <g-icon style="cursor: pointer" @click.stop="dialog = true">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
      </div>
      <div class="main__item">
        <g-text-field-bs :label="$t('settings.tel')" v-model="telephone" required>
          <template v-slot:append-inner>
            <g-icon style="cursor: pointer" @click.stop="dialog = true">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
      </div>
      <div class="main__item">
        <g-text-field-bs :label="$t('settings.taxNo')" v-model="taxNumber" required>
          <template v-slot:append-inner>
            <g-icon style="cursor: pointer" @click.stop="dialog = true">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
      </div>
      <div class="main__item">
        <g-text-field-bs :label="$t('settings.ustId')" v-model="ustId">
          <template v-slot:append-inner>
            <g-icon style="cursor: pointer" @click.stop="dialog = true">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
      </div>
      <div class="main__item">
        <p class="item-label">{{$t('settings.logo')}}</p>
        <g-file-input outlined filled dense prependInnerIcon="icon-upload" svg-icon v-model="file" @change="convertImg" accept="image/*" placeholder="Upload"></g-file-input>
      </div>
      <div class="main__item">
        <p class="item-label">{{$t('settings.logoSize')}}</p>
        <div class="logo">
          <div v-for="i in 6" :key="i" :class="['item', logoSize === i && 'item__selected']" @click="changeLogoSize(i)">
            {{i}}
          </div>
        </div>
      </div>
      <div class="main__item item__big">
        <p class="item-label">{{$t('settings.logoPreview')}}</p>
        <div class="preview-wrapper">
          <img alt :style="imgStyle" :src="logo">
        </div>
      </div>
    </div>
    <dialog-form-input v-model="dialog" @submit="update">
      <template #input>
        <div class="row-flex flex-wrap justify-around">
          <pos-textfield-new style="width: 48%" :label="$t('settings.companyName')" v-model="name" required/>
          <pos-textfield-new style="width: 48%" :label="$t('settings.address')" v-model="address" required/>
          <pos-textfield-new style="width: 48%" :label="$t('settings.address2')" v-model="address2"/>
          <pos-textfield-new style="width: 48%" :label="$t('settings.zipCode')" v-model="zipCode" required/>
          <pos-textfield-new style="width: 48%" :label="$t('settings.city')" v-model="city" required/>
          <pos-textfield-new style="width: 48%" :label="$t('settings.tel')" v-model="telephone" required/>
          <pos-textfield-new style="width: 48%" :label="$t('settings.taxNo')" v-model="taxNumber" required/>
          <pos-textfield-new style="width: 48%" :label="$t('settings.ustId')" v-model="ustId"/>
        </div>
      </template>
    </dialog-form-input>
  </fragment>
</template>

<script>
  import { convertToUnit } from 'pos-vue-framework';

  export default {
    name: 'viewCompany',
    injectService: [
      'SettingsStore:(companyInfo, getCompanyInfo, updateCompanyInfo)'
    ],
    data() {
      return {
        file: null,
        dialog: false,
      }
    },
    computed: {
      name: {
        get() {
          if (this.companyInfo) return this.companyInfo.name || '';
          return ''
        },
        set(val) {
          this.$set(this.companyInfo, 'name', val)
        }
      },
      address: {
        get() {
          if (this.companyInfo) return this.companyInfo.address || '';
          return ''
        },
        set(val) {
          this.$set(this.companyInfo, 'address', val)
        }
      },
      address2: {
        get() {
          if (this.companyInfo) return this.companyInfo.address2 || '';
          return ''
        },
        set(val) {
          this.$set(this.companyInfo, 'address2', val)
        }
      },
      zipCode: {
        get() {
          if (this.companyInfo) return this.companyInfo.zipCode || '';
          return ''
        },
        set(val) {
          this.$set(this.companyInfo, 'zipCode', val)
        }
      },
      city: {
        get() {
          if (this.companyInfo) return this.companyInfo.city || '';
          return ''
        },
        set(val) {
          this.$set(this.companyInfo, 'city', val)
        }
      },
      telephone: {
        get() {
          if (this.companyInfo) return this.companyInfo.telephone || '';
          return ''
        },
        set(val) {
          this.$set(this.companyInfo, 'telephone', val)
        }
      },
      taxNumber: {
        get() {
          if (this.companyInfo) return this.companyInfo.taxNumber || '';
          return ''
        },
        set(val) {
          this.$set(this.companyInfo, 'taxNumber', val)
        }
      },
      ustId: {
        get() {
          if (this.companyInfo) return this.companyInfo.ustId || '';
          return ''
        },
        set(val) {
          this.$set(this.companyInfo, 'ustId', val)
        }
      },
      logo: {
        get() {
          if (this.companyInfo) return this.companyInfo.logo || '';
          return ''
        },
        set(val) {
          this.$set(this.companyInfo, 'logo', val)
        }
      },
      logoSize: {
        get() {
          if (this.companyInfo) return this.companyInfo.logoSize || '';
          return ''
        },
        set(val) {
          this.$set(this.companyInfo, 'logoSize', val)
        }
      },
      imgStyle() {
        const base = 20;
        return {
          width: convertToUnit(base * this.logoSize),
          height: convertToUnit(base * this.logoSize),
        }
      }
    },
    async created() {
      await this.getCompanyInfo();
    },
    methods: {
      convertImg() {
        const reader = new FileReader();
        reader.onload = async () => {
          this.logo = reader.result
          await this.updateCompanyInfo();
        }
        if (this.file) {
          reader.readAsDataURL(this.file);
        }
      },
      async update() {
        this.dialog = false
        await this.updateCompanyInfo()
      },
      async changeLogoSize(size) {
        this.logoSize = size;
        await this.updateCompanyInfo();
      }
    }
  }
</script>

<style scoped lang="scss">
  .main {
    display: grid;
    grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
    grid-auto-columns: 1fr 1fr;
    grid-auto-flow: column;
    grid-gap: 12px 24px;
    padding: 32px 52px;
    height: 100%;
    overflow-y: scroll;
  }

  .bs-tf-wrapper ::v-deep {
    .bs-tf-label {
      font-size: 13px;
    }

    .bs-tf-inner-input-group {
      border-radius: 2px;

      .bs-tf-input {
        padding: 8px;
      }
    }

    .g-icon.icon-keyboard {
      cursor: pointer;
    }
  }

  .g-tf-wrapper {
    margin-bottom: 0;
  }

  .g-file-input {
    &.g-tf-wrapper.g-tf__filled.g-tf__outlined ::v-deep .g-file-input--text {
      padding: 8px;

      p {
        font-weight: 700;
        color: #9E9E9E;
        opacity: 1 !important;
        font-size: 14px;
      }
    }

    ::v-deep .g-tf-prepend__outer {
      display: none;
    }

    ::v-deep .g-tf-prepend__inner {
      padding: 0 !important;
      margin: 0 0 0 16px;

      .g-icon {
        font-size: 16px !important;
        width: 16px !important;
        height: 16px !important;
      }
    }

    ::v-deep fieldset {
      border-color: #ced4da !important;
      border-radius: 2px !important;
    }

    &:focus-within ::v-deep fieldset {
      border-color: #1471ff !important;
    }
  }

  .main__item {
    padding-right: 32px;

    .item-label {
      font-size: 13px;
      line-height: 16px;
      margin-left: 4px;
      margin-top: 6px;
    }

    &.item__big {
      grid-row: span 2;
      display: flex;
      flex-direction: column;

      .preview-wrapper {
        margin: 8px 4px 4px;
        flex: 1;
        display: flex;
        border: 1px solid #ced4da;
        border-radius: 2px;
        align-items: center;
        justify-content: center;
        background-color: #f0f0f0;
      }
    }

    .g-tf-wrapper {
      margin: 4px 0 0 4px;

      ::v-deep .g-tf .g-tf-input {
        padding: 4px 6px;
      }

      ::v-deep .g-tf-append__inner {
        margin-right: 8px;
      }
    }
  }

  .logo {
    display: flex;
    margin-left: 4px;

    .item {
      background: #F0F0F0;
      border: 1px solid #C9C9C9;
      box-sizing: border-box;
      border-radius: 2px;
      padding: 12px 16px;
      margin: 4px 8px 0 0;
      font-size: 13px;
      line-height: 16px;

      &.item__selected {
        border-color: #1471ff;
        border-width: 2px;
      }
    }

  }

  @media screen and (max-width: 1023px) {
    .main {
      padding: 16px;

      &__item {
        padding-right: 8px;

        .bs-tf-wrapper ::v-deep {
          .bs-tf-inner-input-group {
            padding: 0 4px 0 0;

            .bs-tf-input {
              padding: 8px 4px;
            }
          }
        }
      }
    }
  }
</style>
