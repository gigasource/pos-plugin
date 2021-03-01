<script>
import { convertToUnit } from 'pos-vue-framework';
import { computed, ref, withModifiers, watch } from 'vue'
import _ from 'lodash'
import { attrComputed, genScopeId } from '../utils';
import { useI18n } from 'vue-i18n';
import { appHooks, posSettings } from '../AppSharedStates';

export default {
  setup() {
    appHooks.emit('settingChange')
    const { t } = useI18n()
    const file = ref(null)
    const dialog = ref(false)
    const companyInfo = ref({})
    async function loadCompanyInfo() {
      const posSetting = await cms.getModel('PosSetting').findOne({})
      return posSetting.companyInfo
    }
    loadCompanyInfo().then(v => companyInfo.value = v)

    const name = attrComputed(companyInfo, 'name')
    const address = attrComputed(companyInfo, 'address')
    const address2 = attrComputed(companyInfo, 'address2')
    const zipCode = attrComputed(companyInfo, 'zipCode')
    const city = attrComputed(companyInfo, 'city')
    const telephone = attrComputed(companyInfo, 'telephone')
    const taxNumber = attrComputed(companyInfo, 'taxNumber')
    const ustId = attrComputed(companyInfo, 'ustId')
    const logo = attrComputed(companyInfo, 'logo')
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
          logo.value = reader.result
          await updateCompanyInfo();
        }
        if (file.value) {
          reader.readAsDataURL(file.value);
        }
      }
    }, { onTrigger: () => console.log('trigger')})

    async function update() {
      dialog.value = false
      await updateCompanyInfo()
    }

    async function changeLogoSize(size) {
      logoSize.value = size;
      await updateCompanyInfo();
    }

    async function getCompanyInfo() {

    }

    async function updateCompanyInfo() {
      await cms.getModel('PosSetting').findOneAndUpdate(
          {},
          {
            companyInfo: companyInfo.value
          }
      );
      appHooks.emit('settingChange')
    }

    const inputRender = (field, model, require = false) => genScopeId(() =>
        <div class="main__item">
          <g-text-field-bs label={t(`settings.${field}`)} v-model={model.value} required={require} v-slots={{
            'append-inner': () =>
                <g-icon style="cursor: pointer" onClick={withModifiers(() => dialog.value = true, ['stop'])}>
                  icon-keyboard
                </g-icon>
          }}></g-text-field-bs>
        </div>)

    //todo: should auto focus on textfield which user want to modify
    const leftSideRender = genScopeId(() => <>
      {inputRender('companyName', name, true)()}
      {inputRender('address', address, true)()}
      {inputRender('address2', address2)()}
      {inputRender('zipCode', zipCode, true)()}
      {inputRender('city', city, true)()}
      {inputRender('tel', telephone, true)()}
      {inputRender('taxNo', taxNumber, true)()}
      {inputRender('ustId', ustId)()}
    </>)

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
            <pos-textfield-new style="width: 48%" label={t('settings.companyName')} v-model={name.value} required/>
            <pos-textfield-new style="width: 48%" label={t('settings.address')} v-model={address.value} required/>
            <pos-textfield-new style="width: 48%" label={t('settings.address2')} v-model={address2.value}/>
            <pos-textfield-new style="width: 48%" label={t('settings.zipCode')} v-model={zipCode.value} required/>
            <pos-textfield-new style="width: 48%" label={t('settings.city')} v-model={city.value} required/>
            <pos-textfield-new style="width: 48%" label={t('settings.tel')} v-model={telephone.value} required/>
            <pos-textfield-new style="width: 48%" label={t('settings.taxNo')} v-model={taxNumber.value} required/>
            <pos-textfield-new style="width: 48%" label={t('settings.ustId')} v-model={ustId.value}/>
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
