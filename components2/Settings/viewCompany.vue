<script>
import { convertToUnit } from 'pos-vue-framework';
import { computed, reactive, ref, toRaw, watch, withModifiers } from 'vue'
import _ from 'lodash'
import { attrComputed, genScopeId } from '../utils';
import { useI18n } from 'vue-i18n';
import { appHooks } from '../AppSharedStates';

export default {
  setup() {
    appHooks.emit('settingChange')
    const { t } = useI18n()
    const file = ref(null)
    const dialog = ref(false)
    const companyInfo = ref({})
    const companyInfoDialogData = reactive({
      name: '',
      address: '',
      address2: '',
      zipCode: '',
      city: '',
      telephone: '',
      taxNumber: '',
      ustId: '',
    })
    const companyInfoModel = reactive({
      name: '',
      address: '',
      address2: '',
      zipCode: '',
      city: '',
      telephone: '',
      taxNumber: '',
      ustId: '',
    })

    async function loadCompanyInfo() {
      const posSetting = await cms.getModel('PosSetting').findOne({})
      companyInfo.value = posSetting.companyInfo
      sync()
    }

    function sync() {
      companyInfoModel.name = companyInfo.value.name
      companyInfoModel.address = companyInfo.value.address
      companyInfoModel.address2 = companyInfo.value.address2
      companyInfoModel.zipCode = companyInfo.value.zipCode
      companyInfoModel.city = companyInfo.value.city
      companyInfoModel.telephone = companyInfo.value.telephone
      companyInfoModel.taxNumber = companyInfo.value.taxNumber
      companyInfoModel.ustId = companyInfo.value.ustId
    }

    loadCompanyInfo()

    const name = attrComputed(companyInfo, 'name', '')
    const address = attrComputed(companyInfo, 'address', '')
    const address2 = attrComputed(companyInfo, 'address2', '')
    const zipCode = attrComputed(companyInfo, 'zipCode', '')
    const city = attrComputed(companyInfo, 'city', '')
    const telephone = attrComputed(companyInfo, 'telephone', '')
    const taxNumber = attrComputed(companyInfo, 'taxNumber', '')
    const ustId = attrComputed(companyInfo, 'ustId', '')
    const logo = attrComputed(companyInfo, 'logo', '')
    const logoSize = attrComputed(companyInfo, 'logoSize', 1)
    const imgStyle = computed(() => {
      const base = 20;
      return {
        width: convertToUnit(base * logoSize.value),
        height: convertToUnit(base * logoSize.value),
      }
    })

    watch(() => file.value, async (val, oldV) => {
      if (JSON.stringify(val) !== JSON.stringify(oldV)) {
        const reader = new FileReader();
        reader.onload = async () => {
          await updateCompanyInfo({
            logo: reader.result
          });
        }
        if (file.value) {
          reader.readAsDataURL(file.value);
        }
      }
    })

    async function update() {
      dialog.value = false
      await updateCompanyInfo(toRaw(companyInfoDialogData))
    }

    async function directUpdate() {
      await updateCompanyInfo(toRaw(companyInfoModel))
    }

    async function changeLogoSize(size) {
      await updateCompanyInfo({
        logoSize: size
      });
    }


    async function updateCompanyInfo(_companyInfo) {
      const newCompanyInfo = Object.assign(companyInfo.value, _companyInfo)
      await cms.getModel('PosSetting').findOneAndUpdate(
          {},
          {
            companyInfo: newCompanyInfo
          }, { upsert: true }
      );
      await appHooks.emit('settingChange')
      Object.keys(_companyInfo).forEach(key => {
        companyInfo.value[key] = _companyInfo[key]
        companyInfoModel[key] = _companyInfo[key]
      })
    }

    function openDialog() {
      dialog.value = true
      companyInfoDialogData.name = name.value
      companyInfoDialogData.address = address.value
      companyInfoDialogData.address2 = address2.value
      companyInfoDialogData.zipCode = zipCode.value
      companyInfoDialogData.city = city.value
      companyInfoDialogData.telephone = telephone.value
      companyInfoDialogData.taxNumber = taxNumber.value
      companyInfoDialogData.ustId = ustId.value
    }

    const debounceDirectUpdate = _.debounce(directUpdate, 500)

    const inputRender = (i18nField, field, model, required = false) =>
        <div class="main__item">
          <g-text-field-bs label={t(`settings.${i18nField}`)} v-model={companyInfoModel[field]} onUpdate:modelValue={debounceDirectUpdate} required={required} v-slots={{
            'append-inner': () =>
                <g-icon style="cursor: pointer" onClick={withModifiers(openDialog, ['stop'])}>
                  icon-keyboard
                </g-icon>
          }}/>
        </div>


    //todo: should auto focus on textfield which user want to modify
    const leftSideRender = () => <>
      {inputRender('companyName', 'name', true)}
      {inputRender('address', 'address', true)}
      {inputRender('address2', 'address2')}
      {inputRender('zipCode', 'zipCode', true)}
      {inputRender('city', 'city', true)}
      {inputRender('tel', 'telephone', true)}
      {inputRender('taxNo', 'taxNumber', true)}
      {inputRender('ustId', 'ustId')}
    </>

    const rightSideRender = genScopeId(() => <>
          <div class="main__item">
            <p class="item-label">
              {t('settings.logo')} </p>
            <g-file-input outlined filled dense prepend-inner-icon="icon-upload" svg-icon v-model={file.value} accept="image/*" placeholder="Upload"></g-file-input>
          </div>
          <div class="main__item">
            <p class="item-label">
              {t('settings.logoSize')} </p>
            <div class="logo">
              {_.range(6).map(i =>
                  <div key={i + 1} class={['item', logoSize.value === i + 1 && 'item__selected']} onClick={() => changeLogoSize(i + 1)}>
                    {i + 1}
                  </div>
              )} </div>
          </div>
          <div class="main__item item__big">
            <p class="item-label">
              {t('settings.logoPreview')} </p>
            <div class="preview-wrapper">
              <img alt style={imgStyle.value} src={logo.value}> </img>
            </div>
          </div>
        </>
    )
    const dialogRender = genScopeId(() => <dialog-form-input v-model={dialog.value} onSubmit={update} v-slots={{
      'input': genScopeId(() =>
          <div class="row-flex flex-wrap justify-around">
            <pos-textfield-new style="width: 48%" label={t('settings.companyName')} v-model={companyInfoDialogData.name} required/>
            <pos-textfield-new style="width: 48%" label={t('settings.address')} v-model={companyInfoDialogData.address} required/>
            <pos-textfield-new style="width: 48%" label={t('settings.address2')} v-model={companyInfoDialogData.address2}/>
            <pos-textfield-new style="width: 48%" label={t('settings.zipCode')} v-model={companyInfoDialogData.zipCode} required/>
            <pos-textfield-new style="width: 48%" label={t('settings.city')} v-model={companyInfoDialogData.city} required/>
            <pos-textfield-new style="width: 48%" label={t('settings.tel')} v-model={companyInfoDialogData.telephone} required/>
            <pos-textfield-new style="width: 48%" label={t('settings.taxNo')} v-model={companyInfoDialogData.taxNumber} required/>
            <pos-textfield-new style="width: 48%" label={t('settings.ustId')} v-model={companyInfoDialogData.ustId}/>
          </div>)
    }}>
    </dialog-form-input>)
    return genScopeId(() => <div class="main">
      {leftSideRender()}
      {rightSideRender()}
      {dialogRender()}
    </div>)
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
    margin-right: 8px;
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
