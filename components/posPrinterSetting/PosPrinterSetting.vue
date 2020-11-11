<template>
  <div class="configuration">
    <div v-if="type === 'kitchen'" class="config">
      <g-text-field-bs :label="$t('settings.name')" v-model="editableName">
        <template #append-inner>
          <g-icon style="cursor: pointer" @click="openDialog('nameInput')">icon-keyboard</g-icon>
        </template>
      </g-text-field-bs>
    </div>
    <div class="config">
      <p class="title">{{$t('settings.thermalPrinter')}}</p>
      <div class="row-flex flex-wrap">
        <div v-for="(type, i) in printerTypes" :key="i"
             :class="['printer', selectedPrinterType === type && 'printer__active']" @click="select(type)">
          {{type.name}}
        </div>
        <div class="printer" @click="resetPrinter">
          {{$t('settings.reset')}}
        </div>
      </div>
    </div>
    <g-divider inset/>
    
    <!-- Printer config -->
    <template v-if="selectedPrinterType">
      <div v-if="selectedPrinterType.value === 'ip'" class="config row-flex align-items-end">
        <g-text-field-bs :label="$t('settings.ipAddress')" v-model="ipAddress">
          <template #append-inner>
            <g-icon style="cursor: pointer" @click="openDialog('ipInput')">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
        <g-btn-bs background-color="blue accent 3" style="padding: 6px; flex: 1; transition: none" @click="$emit('testPrinter', printer)">
          {{$t('settings.testPrinter')}}
        </g-btn-bs>
      </div>
      <div v-else-if="selectedPrinterType.value === 'usb'" class="config row-flex align-items-end">
        <g-select
            class="config__usb-printer-paths"
            :style="{ flex: 1 }"
            :items="usbPrinterSelectModel"
            :value="printer.usb"
            @input="setUsbPrinter"
            textFieldComponent="GTextFieldBs"/>
        <g-btn-bs background-color="blue accent 3" style="padding: 6px; transition: none" @click="$emit('testPrinter', printer)">
          {{$t('settings.testPrinter')}}
        </g-btn-bs>
      </div>
      <div v-else class="config">
        <g-btn-bs background-color="blue accent 3" style="padding: 6px 16px; transition: none" @click="$emit('testPrinter', printer)">
          {{$t('settings.testPrinter')}}
        </g-btn-bs>
      </div>
    </template>
    
    <div v-if="type === 'entire'" class="receipt-config">
      <g-switch :label="$t('settings.onlyTakeAway')" v-model="onlyTakeAway"/>
      <div class="title">Include:</div>
      <g-grid-select multiple item-cols="auto" :items="listReceipt" v-model="includes">
        <template v-slot:default="{toggleSelect, item}">
          <div class="option" @click="e => {toggleSelect(item);}">
            {{item}}
          </div>
        </template>
        <template v-slot:selected="{toggleSelect, item}">
          <div class="option option--selected" @click="e => {toggleSelect(item);}">
            {{item}}
          </div>
        </template>
      </g-grid-select>
    </div>
    <g-divider class="mt-2" inset/>
    <div class="switch-group">
      <g-switch :label="$t('settings.splitArticles')" v-model="oneReceiptForOneArticle" v-if="type === 'kitchen'"/>
      <g-switch :label="$t('settings.groupArticles')" v-model="groupArticles" v-if="type === 'kitchen'"/>
      <g-switch :label="$t('settings.sound')" v-model="sound"/>
      <g-switch :label="$t('settings.escPos')" v-model="escPOS"/>
      <g-switch label="TSC POS" v-model="tscPOS"/>
    </div>
    <div class="title" style="margin-left: 12px">{{$t('settings.receiptFontSize')}}</div>
    <g-grid-select mandatory item-cols="auto" :items="listFontSize" v-model="fontSize" style="margin-left: 12px; padding-top: 4px">
      <template v-slot:default="{ toggleSelect, item }">
        <div class="option" @click="toggleSelect(item)">
          {{item}}
        </div>
      </template>
      <template v-slot:selected="{ toggleSelect, item }">
        <div class="option option--selected">
          {{item}}
        </div>
      </template>
    </g-grid-select>
    <div class="title" style="margin-left: 12px">{{$t('settings.receiptTopMargin')}}</div>
    <g-grid-select mandatory item-cols="auto" :items="listMarginSize" v-model="marginTop" style="margin-left: 12px; padding-top: 4px">
      <template v-slot:default="{ toggleSelect, item }">
        <div class="option" @click="toggleSelect(item)">
          + {{item}} Cm
        </div>
      </template>
      <template v-slot:selected="{ toggleSelect, item }">
        <div class="option option--selected">
          + {{item}} Cm
        </div>
      </template>
    </g-grid-select>
    <template v-if="groupPrinter && groupPrinter.type === 'kitchen'">
      <g-divider inset class="mt-2 mb-2"/>
      <div class="title" style="margin-left: 12px">Default tax</div>
      <div class="row-flex" style="margin-left: 12px">
        <div class="col-3">{{$t('restaurant.product.dineInTax')}}</div>
        <g-grid-select mandatory return-object item-cols="auto" :items="dineInTaxCategories" item-value="_id" v-model="dineInTax" style="margin-left: 12px">
          <template v-slot:default="{ toggleSelect, item }">
            <div class="option" @click="toggleSelect(item)">
              {{item.name}} ({{item.value}}%)
            </div>
          </template>
          <template v-slot:selected="{ item }">
            <div class="option option--selected">
              {{item.name}} ({{item.value}}%)
            </div>
          </template>
        </g-grid-select>
      </div>

    <div class="row-flex" style="margin-left: 12px; margin-top: 8px;">
      <div class="col-3">{{$t('restaurant.product.takeAwayTax')}}</div>
      <g-grid-select mandatory return-object item-cols="auto" :items="takeAwayTaxCategories" item-value="_id" v-model="takeAwayTax" style="margin-left: 12px">
        <template v-slot:default="{ toggleSelect, item }">
          <div class="option" @click="toggleSelect(item)">
            {{item.name}} ({{item.value}}%)
          </div>
        </template>
        <template v-slot:selected="{ item }">
          <div class="option option--selected">
            {{item.name}} ({{item.value}}%)
          </div>
        </template>
      </g-grid-select>
    </div>
    </template>

    <dialog-form-input v-model="showDialog" @submit="updateSettings">
      <template #input>
        <div>
          <g-text-field-bs label="Name" v-model="editName" ref="nameInput"/>
          <g-text-field-bs v-if="selectedPrinterType && selectedPrinterType.value === 'ip'"
                           label="IP Address" v-model="editIp" ref="ipInput"/>
        </div>
      </template>
    </dialog-form-input>
  </div>
</template>

<script>
  import DialogFormInput from '../pos-shared-components/dialogFormInput';
  export default {
    name: "PosPrinterSetting",
    components: { DialogFormInput },
    props: {
      id: null,
      name: String,
      type: String,
      index: Number
    },
    injectService: [
      'SettingsStore:(printer, getPrinterById, updateGroupPrinterName, updatePrinter, getGroupPrintersByType, getAllTaxCategory, getGroupPrinterById, updateGroupPrinter, usbPrinters, loadUsbPrinters)',
    ],
    data() {
      return {
        printerTypes: [
          {name: this.$t('settings.networkPrinter'), value: 'ip'},
          // {name: this.$t('settings.serialPrinter'), value: 'com'},
          {name: this.$t('settings.usb'), value: 'usb'},
          {name: 'Integrate', value: 'integrate'}
        ],
        selectedPrinterType: null,
        listReceipt: [],
        listFontSize: [1, 2, 3],
        listMarginSize: [0, 1, 2, 3, 4],
        editName: '',
        editIp: '',
        showDialog: false,
        printer: null,
        listTaxCategories: [],
        groupPrinter: null
      }
    },
    computed: {
      editableName: {
        get() {
          if (this.name) {
            this.editName = this.name
            return this.name
          }
          return ''
        },
        async set(val) {
          this.editName = val
          await this.updateGroupPrinterName(this.id, val)
        }
      },
      ipAddress: {
        get() {
          if (this.printer) {
            this.editIp = this.printer.ip
            return this.printer.ip
          }
          return ''
        },
        async set(val) {
          this.editIp = val
          if (this.printer) {
            this.$set(this.printer, 'ip', val)
          } else {
            this.printer = {
              printerType: 'ip',
              ip: val
            }
          }
          await this.updatePrinter(this.printer._id, this.printer, this.id, this.index)
        }
      },
      onlyTakeAway: {
        get() {
          if (this.printer) {
            return this.printer.onlyTakeAway
          }
          return false
        },
        async set(val) {
          if (this.printer) {
            this.$set(this.printer, 'onlyTakeAway', val)
          } else {
            this.printer = {
              onlyTakeAway: val
            }
          }
          await this.updatePrinter(this.printer._id, this.printer, this.id, this.index)
        }
      },
      includes: {
        get() {
          if (this.printer) {
            return this.printer.includes
          }
          return []
        },
        async set(val) {
          if (this.printer) {
            this.$set(this.printer, 'includes', val)
          } else {
            this.printer = {
              includes: val
            }
          }
          await this.updatePrinter(this.printer._id, this.printer, this.id, this.index)
        }
      },
      oneReceiptForOneArticle: {
        get() {
          if(this.printer) {
            return this.printer.oneReceiptForOneArticle
          }
          return false
        },
        async set(val) {
          if(this.printer)
            this.$set(this.printer, 'oneReceiptForOneArticle', val)
          else {
            this.printer = {
              oneReceiptForOneArticle: val
            }
          }
          await this.updatePrinter(this.printer._id, this.printer, this.id, this.index)
        }
      },
      groupArticles: {
        get() {
          if(this.printer) {
            return this.printer.groupArticles
          }
          return false
        },
        async set(val) {
          if(this.printer)
            this.$set(this.printer, 'groupArticles', val)
          else
            this.printer = {
              groupArticles: val
            }
          await this.updatePrinter(this.printer._id, this.printer, this.id, this.index)
        }
      },
      sound: {
        get() {
          if(this.printer) {
            return this.printer.sound
          }
          return false
        },
        async set(val) {
          if(this.printer)
            this.$set(this.printer, 'sound', val)
          else
            this.printer = {
              sound: val
            }
          await this.updatePrinter(this.printer._id, this.printer, this.id, this.index)
        }
      },
      escPOS: {
        get() {
          if(this.printer) {
            return this.printer.escPOS
          }
          return false
        },
        async set(val) {
          if(this.printer)
            this.$set(this.printer, 'escPOS', val)
          else
            this.printer = {
              escPOS: val
            }
          await this.updatePrinter(this.printer._id, this.printer, this.id, this.index)
        }
      },
      tscPOS: {
        get() {
          if(this.printer) {
            return this.printer.tscPOS
          }
          return false
        },
        async set(val) {
          if(this.printer)
            this.$set(this.printer, 'tscPOS', val)
          else
            this.$set(this, 'printer', { tscPOS: val })
          await this.updatePrinter(this.printer._id, this.printer, this.id, this.index)
        }
      },
      fontSize: {
        get() {
          if(this.printer) {
            return this.printer.fontSize
          }
        },
        async set(val) {
          if(this.printer)
            this.$set(this.printer, 'fontSize', val)
          else
            this.printer = {
              fontSize: val
            }
          await this.updatePrinter(this.printer._id, this.printer, this.id, this.index)
        }
      },
      marginTop: {
        get() {
          if(this.printer) {
            return this.printer.marginTop
          }
        },
        async set(val) {
          if(this.printer)
            this.$set(this.printer, 'marginTop', val)
          else
            this.printer = {
              marginTop: val
            }
          await this.updatePrinter(this.printer._id, this.printer, this.id, this.index)
        }
      },
      dineInTax: {
        get() {
          if (!this.groupPrinter || !this.listTaxCategories || !this.listTaxCategories.length) return
          if (this.groupPrinter && this.groupPrinter.defaultDineInTax) {
            return this.listTaxCategories.find(i => i._id.toString() === this.groupPrinter.defaultDineInTax)
          }
        },
        async set(taxCategory) {
          await this.updateGroupPrinter(this.id, 'defaultDineInTax', taxCategory._id.toString())
          this.groupPrinter = await this.getGroupPrinterById(this.id)
        }
      },
      takeAwayTax: {
        get() {
          if (!this.groupPrinter || !this.listTaxCategories || !this.listTaxCategories.length) return
          if (this.groupPrinter && this.groupPrinter.defaultTakeAwayTax) {
            return this.listTaxCategories.find(i => i._id.toString() === this.groupPrinter.defaultTakeAwayTax)
          }
        },
        async set(taxCategory) {
          await this.updateGroupPrinter(this.id, 'defaultTakeAwayTax', taxCategory._id.toString())
          this.groupPrinter = await this.getGroupPrinterById(this.id)
        }
      },
      dineInTaxCategories() {
        if (!this.listTaxCategories || !this.listTaxCategories.length) return []
        return this.listTaxCategories.filter(i => i.type.includes('dineIn'))
      },
      takeAwayTaxCategories() {
        if (!this.listTaxCategories || !this.listTaxCategories.length) return []
        return this.listTaxCategories.filter(i => i.type.includes('takeAway'))
      },
      usbPrinterSelectModel () {
        // refer: backend/usb-printer/usb-printer.js
        return (this.usbPrinters || []).map((printer, i) => ({
          text: `Printer ${i+1} (${printer})`,
          value: printer
        }))
      }
    },
    methods: {
      async select(type) {
        this.selectedPrinterType = type;
        if (this.printer) {
          this.printer.printerType = type.value;
        } else {
          this.printer = {
            printerType: type.value
          }
        }
        
        if (type ==='usb') {
          await this.loadUsbPrinters();
        }
        
        await this.updatePrinter(this.printer._id, this.printer, this.id, this.index)
      },
      async resetPrinter() {
        this.selectedPrinterType = null;
        if (this.printer) {
          this.printer.printerType = null;
        } else {
          this.printer = {
            printerType: null
          }
        }
        await this.updatePrinter(this.printer._id, this.printer, this.id, this.index)
      },
      async setupPrinter() {
        await this.getPrinterById(this.id, this.index)
        if (this.printer) {
          this.selectedPrinterType = this.printerTypes.find(t => t.value === this.printer.printerType)
        }
      },
      openDialog(ref) {
        this.showDialog = true
        this.$nextTick(() => {
          setTimeout(() => {
            this.$refs[ref].onFocus()
          }, 200)
        })
      },
      updateSettings() {
        if (!this.editName) return
        this.editableName = this.editName

        if (this.selectedPrinterType && this.selectedPrinterType.value === 'ip' && this.editIp) {
          this.ipAddress = this.editIp
        }
        this.showDialog = false
      },
      async setUsbPrinter(value) {
        console.log("PosPrinterSetting:setUsbPrinter", value)
        if (this.printer) {
          this.$set(this.printer, 'usb', value);
        } else {
          this.$set(this, 'printer', { usb: value });
        }
        await this.updatePrinter(this.printer._id, this.printer, this.id, this.index)
      }
    },
    watch: {
      async id(val) {
        if (!val) {
          if (this.printer) {
            this.printer = {}
          }
          this.selectedPrinterType = null
          return
        }
        await this.setupPrinter()
        this.groupPrinter = await this.getGroupPrinterById(val)
      },
      async index() {
        await this.setupPrinter()
      },
      async type(val) {
        if(val && val === 'receipt') {
          const receipts = await this.getGroupPrintersByType('kitchen')
          this.listReceipt = receipts.map(r => r.name)
        }
      }
    },
    async created() {
      await this.setupPrinter()
      const receipts = await this.getGroupPrintersByType('kitchen')
      this.listReceipt = receipts.map(r => r.name)
      this.listTaxCategories = await this.getAllTaxCategory()
      this.groupPrinter = await this.getGroupPrinterById(this.id)
    },
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
      margin-right: 4px;

      &--selected {
        border-color: #90CAF9;
        background-color: #E3F2FD;
      }
    }

  }

  @media screen and (max-width: 1023px){
    .configuration {
      padding-left: 16px;
    }
  }
</style>
