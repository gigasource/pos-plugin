<script>
import {
  onSelectPrinter,
  printerTypes,
  selectingPrinter,
  selectingPrinterGroup,
  selectingPrinterGroupType,
  kitchenPrinterGroups,
  testPrinter
} from './pos-print-shared';
import { dineInTaxCategories, takeAwayTaxCategories } from '../Settings/TaxSetting/view-tax-logics';
import { useI18n } from 'vue-i18n';
import { computed, ref, watch } from 'vue'
import { genScopeId } from '../utils';
import { PrinterSettingFactory } from './printer-setting-factory'

export default {
  setup() {
    const { t } = useI18n()
    const {
      fontSizeList,
      marginSizeList,
      usbPrinterSelectModel,
      nameInputRef,
      ipInputRef,
      openDialog,
      onSelectPrinterType,
      onResetPrinterType,
      showDialog,
    } = PrinterSettingFactory()

    const printerGroupNameTf = ref('')
    const ipTf = ref('')

    const printerGroupNameTfComputed = computed({
      get() {
        return selectingPrinterGroup.value.name
      },
      set(value) {
        printerGroupNameTf.value = value
      }
    })

    const ipTfComputed = computed({
      get() {
        return selectingPrinter.value.ip
      },
      set(value) {
        ipTf.value = value
      }
    })


    function updateSettings() {
      if (printerGroupNameTf.value) selectingPrinterGroup.value.name = printerGroupNameTf.value
      if (ipTf.value) selectingPrinter.value.ip = ipTf.value
      showDialog.value = false
    }

    watch(() => selectingPrinterGroup.value, () => {
      if (selectingPrinterGroup.value && !selectingPrinter.value) {
        onSelectPrinter(selectingPrinterGroup.value.printers[0])
      }
    }, { deep: true })

    const renderTestPrinterButton = genScopeId((attrs) =>
        <g-btn-bs background-color="blue accent 3" {...attrs} onClick={() => testPrinter(selectingPrinter.value)}>
          {t('settings.testPrinter')}
        </g-btn-bs>)

    const renderPrinterGroupNameInput = () => (selectingPrinterGroupType.value === 'kitchen') &&
        <div class="config">
          <g-text-field-bs label={t('settings.name')} v-model={selectingPrinterGroup.value.name} v-slots={{
            'append-inner': () =>
                <g-icon style="cursor: pointer" onClick={() => openDialog(nameInputRef)}>
                  icon-keyboard
                </g-icon>
          }}/>
        </div>

    const renderPrinterTypeSelect = () =>
        <div class="config">
          <p class="title">
            {t('settings.thermalPrinter')} </p>
          <div class="row-flex flex-wrap">
            {printerTypes.map((type, i) =>
                <div key={i}
                     class={['printer', selectingPrinter.value.printerType === type.value && 'printer__active']}
                     onClick={() => onSelectPrinterType(type.value)}>
                  {t(`settings.${type.name}`, type.name)}
                </div>
            )}
            <div class="printer" onClick={onResetPrinterType}>
              {t('settings.reset')}
            </div>
          </div>
        </div>
    const renderConnectionInputs = () => (selectingPrinter.value) && selectingPrinter.value.printerType &&
        (
            (selectingPrinter.value.printerType === 'ip') ?
                <div class="config row-flex align-items-end">
                  <g-text-field-bs label={t('settings.ipAddress')} v-model={selectingPrinter.value.ip} v-slots={{
                    'append-inner': () =>
                        <g-icon style="cursor: pointer" onClick={() => openDialog(ipInputRef)}>
                          icon-keyboard
                        </g-icon>
                  }}/>
                  {renderTestPrinterButton({ style: 'padding: 6px; flex: 1; transition: none' })}
                </div>
                :
                (
                    (selectingPrinter.value.printerType === 'usb') ?
                        <div class="config row-flex align-items-end">
                          <g-select class="config__usb-printer-paths"
                                    style={{ flex: 1 }}
                                    items={usbPrinterSelectModel.value}
                                    v-model={selectingPrinter.value.usb}
                                    textFieldComponent="GTextFieldBs"
                          />
                          {renderTestPrinterButton({ style: 'padding: 6px; transition: none' })}
                        </div>
                        :
                        <div class="config">
                          {renderTestPrinterButton({ style: 'padding: 6px; transition: none' })}
                        </div>
                )
        )

    const renderReceiptConfig = () => (selectingPrinterGroup.value.type === 'entire') &&
        <div class="receipt-config">
          <g-switch label={t('settings.onlyTakeAway')} v-model={selectingPrinter.value.onlyTakeAway}/>
          <div class="title">
            Include:
          </div>
          <g-grid-select multiple item-cols="auto" returnObject v-model={selectingPrinter.value.includes} items={kitchenPrinterGroups.value} v-slots={{
            'default': genScopeId(({ toggleSelect, item }) =>
                <div class="option" onClick={() => toggleSelect(item)}>
                  {item.name}
                </div>)
            ,
            'selected': genScopeId(({ toggleSelect, item }) =>
                <div class="option option--selected" onClick={() => toggleSelect(item)}>
                  {item.name}
                </div>)
          }}/>
        </div>

    const renderPrinterSettings = () =>
        <div class="switch-group">
          {
            (selectingPrinterGroup.value.type === 'kitchen') && <>
              <g-switch label={t('settings.splitArticles')} v-model={selectingPrinter.value.oneReceiptForOneArticle}/>
              <g-switch label={t('settings.groupArticles')} v-model={selectingPrinter.value.groupArticles}/>
            </>
          }
          <g-switch label={t('settings.sound')} v-model={selectingPrinter.value.sound}/>
          <g-switch label={t('settings.escPos')} v-model={selectingPrinter.value.escPOS}/>
          <g-switch label="TSC POS" v-model={selectingPrinter.value.tscPOS}/>
        </div>
    const renderFn = genScopeId(() =>
        (selectingPrinterGroup.value) &&
        <div class="configuration">
          {
            renderPrinterGroupNameInput()
          }
          {renderPrinterTypeSelect()}
          <g-divider inset/>
          {renderConnectionInputs()}
          {renderReceiptConfig()}
          <g-divider class="mt-2" inset/>
          {renderPrinterSettings()}
          <div class="title" style="margin-left: 12px">
            {t('settings.receiptFontSize')}
          </div>
          <g-grid-select mandatory grid={false} items={fontSizeList} v-model={selectingPrinter.value.fontSize} style="margin-left: 12px; padding-top: 4px" v-slots={{
            'default': genScopeId(({ toggleSelect, item }) =>
                <g-btn-bs class="option" onClick={() => toggleSelect(item)}>
                  {item}
                </g-btn-bs>)
            ,
            'selected': genScopeId(({ item }) =>
                <g-btn-bs class="option option--selected">
                  {item}
                </g-btn-bs>)
          }}/>
          <div class="title" style="margin-left: 12px">
            {t('settings.receiptTopMargin')}
          </div>
          <g-grid-select mandatory grid={false} items={marginSizeList} v-model={selectingPrinter.value.marginTop} style="margin-left: 12px; padding-top: 4px" v-slots={{
            'default': genScopeId(({ toggleSelect, item }) =>
                <g-btn-bs class="option" onClick={() => toggleSelect(item)}>
                  + {item} Cm
                </g-btn-bs>)
            ,
            'selected': genScopeId(({ item }) =>
                <g-btn-bs class="option option--selected">
                  + {item} Cm
                </g-btn-bs>)
          }}/>
          {
            (selectingPrinterGroup.value.type === 'kitchen') &&
            <>
              <g-divider inset class="mt-2 mb-2"/>
              <div class="title" style="margin-left: 12px">
                Default tax
              </div>
              <div class="row-flex" style="margin-left: 12px">
                <div class="col-3">
                  {t('restaurant.product.dineInTax')}
                </div>
                <g-grid-select mandatory return-object item-cols="auto" items={dineInTaxCategories.value} item-value="_id" v-model={selectingPrinter.value.dineInTax} style="margin-left: 12px" v-slots={{
                  'default': genScopeId(({ toggleSelect, item }) =>
                      <div class="option" onClick={() => toggleSelect(item)}>
                        {item.name} ({item.value}%)
                      </div>)
                  ,
                  'selected': genScopeId(({ item }) =>
                      <div class="option option--selected">
                        {item.name} ({item.value}%)
                      </div>)
                }}/>
              </div>
              <div class="row-flex" style="margin-left: 12px; margin-top: 8px;">
                <div class="col-3">
                  {t('restaurant.product.takeAwayTax')} </div>
                <g-grid-select mandatory
                               return-object
                               item-cols="auto"
                               items={takeAwayTaxCategories.value}
                               item-value="_id"
                               v-model={selectingPrinter.value.takeAwayTax}
                               style="margin-left: 12px"
                               v-slots={{
                                 'default': genScopeId(({ toggleSelect, item }) =>
                                     <div class="option" onClick={() => toggleSelect(item)}>
                                       {item.name} ({item.value}%)
                                     </div>)
                                 ,
                                 'selected': genScopeId(({ item }) =>
                                     <div class="option option--selected">
                                       {item.name} ({item.value}%)
                                     </div>)
                               }}
                />
              </div>
            </>
          }
          <dialog-form-input v-model={showDialog.value} onSubmit={updateSettings} v-slots={{
            'input': () =>
                <div>
                  <g-text-field-bs label="Name" v-model={printerGroupNameTfComputed.value} ref={nameInputRef}/>
                  {
                    (selectingPrinter.value.printerType === 'ip') &&
                    <g-text-field-bs label="IP Address" v-model={ipTfComputed.value} ref={ipInputRef}/>
                  }
                </div>
          }}/>
        </div>)
    return {
      renderFn,
      onSelectPrinter
    }
  }, render() {
    return this.renderFn()
  }
}
</script>

<style scoped lang="scss">
.configuration {
  padding-left: 32px;

  .title {
    color: #1D1D26;
    font-weight: 700;
    font-size: 16px;
    line-height: 20px;
    margin-left: 4px;
    margin-bottom: 4px;
    margin-top: 2px;
  }

  .config {
    padding: 16px 8px 12px;

    .printer {
      width: calc(25% - 8px);
      flex: 0 0 calc(25% - 8px);
      margin: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F0F0F0;
      border: 1px solid #979797;
      border-radius: 2px;
      padding: 8px 16px;
      color: #4D4D4E;
      font-size: 13px;
      line-height: 16px;
      cursor: pointer;

      &__active {
        border-color: #1271ff;
        background: #E3F2FD;
      }
    }

    &__usb-printer-paths {
      ::v-deep {
        .bs-tf-wrapper {
          margin-top: 0;
          margin-bottom: 0;
        }
      }
    }
  }

  .bs-tf-wrapper {
    width: 65%;
    margin: 0 0 0 4px;

    ::v-deep .bs-tf-label {
      font-weight: 700;
      margin-bottom: 6px;
      line-height: 1;
    }
  }

  .receipt-config {
    padding: 0 12px;

    ::v-deep .g-switch-label {
      font-size: 13px;
    }
  }

  ::v-deep .g-col {
    padding: 0;
  }

  .switch-group {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-auto-rows: 1fr;
    grid-column-gap: 36px;
    margin-left: 8px;

    .g-switch-wrapper {
      margin: 4px;

      ::v-deep .g-switch-label {
        font-size: 13px;
      }
    }
  }

  .option {
    padding: 2px 8px;
    text-align: center;
    font-size: 13px;
    font-style: italic;
    border-radius: 2px;
    border: 1px solid #E0E0E0;
    min-width: 50px;
    margin-right: 8px;
    margin-left: 0;
    height: 24px;

    &--selected {
      border-color: #90CAF9;
      background-color: #E3F2FD;
    }
  }

}

@media screen and (max-width: 1023px) {
  .configuration {
    padding-left: 16px;
  }
}
</style>
