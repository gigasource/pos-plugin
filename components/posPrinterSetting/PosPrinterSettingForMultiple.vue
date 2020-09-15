<template>
  <div class="setting">
    <g-tabs :items="tabs" v-model="tab" addable @add="addNewSetting" deletable @delete="dialog.value = true">
      <g-tab-item v-for="tabItem in tabs" :key="tabItem._id" :item="tabItem">
        <div style="margin-top: 12px; margin-left: 12px; font-weight: 700">{{$t('settings.useFor')}}</div>
        <g-grid-select multiple :items="hardwares" v-model="tabItem.hardwares" item-cols="auto">
          <template v-slot:default="{toggleSelect, item}">
            <div class="hardware" @click="e => {toggleSelect(item); updateTitle(tabItem)}">
              {{item}}
            </div>
          </template>
          <template v-slot:selected="{toggleSelect, item}">
            <div class="hardware hardware--selected" @click="e => {toggleSelect(item); updateTitle(tabItem)}">
              {{item}}
            </div>
          </template>
        </g-grid-select>
        <pos-printer-setting :id="id" :name="name" :type="type" :index="index"/>
      </g-tab-item>
    </g-tabs>
    <dialog-confirm-delete v-model="dialog.value" type=" printer setting " @submit="deletePrinterSetting"/>
  </div>
</template>

<script>
  export default {
    name: 'PosPrinterSettingForMultiple',
    props: {
      id: null,
      name: String,
      type: String
    },
    injectService: ['SettingsStore:(getListHardware, getGroupPrinterById, getPrinterById, updatePrinter, printer, deletePrinter)'],
    data() {
      return {
        tabs: [],
        tab: null,
        hardwares: [],
        index: 0,
        dialog: {
          value: false
        },
        newTabTitle: this.$t('settings.newSetting')
      }
    },
    watch: {
      tab(val) {
        if (val) {
          this.index = this.tabs.findIndex(t => t.id === val.id)
        }
      },
      async id(val) {
        if (val) {
          this.index = 0
          await this.genTabs()
        }
      }
    },
    methods: {
      async addNewSetting() {
        await this.updatePrinter(null, {}, this.id)
        await this.genTabs()
      },
      async deletePrinterSetting() {
        await this.deletePrinter(this.id)
        if (this.index > 0 && this.index + 1 === this.tabs.length) {
          this.index--
        }
        await this.genTabs()
      },
      async updateTitle(tab) {
        let title = tab.hardwares.sort().join('-')
        if (!title) title = this.newTabTitle
        tab.title = title
        if (!this.printer._id) await this.getPrinterById(this.id, this.index)
        this.printer.hardwares = tab.hardwares
        await this.updatePrinter(this.printer._id, this.printer, this.id, this.index)
        //trigger slider calculation
        const index = this.tabs.findIndex(t => t.id === tab.id)
        this.tabs.splice(index, 1, tab)
      },
      async genTabs() {
        const groupPrinter = await this.getGroupPrinterById(this.id)
        if (groupPrinter && groupPrinter.printers.length === 0) {
          this.tabs = [{ title: this.newTabTitle, id: 1, hardwares: [] }]
        } else {
          this.tabs = groupPrinter.printers.map(p => ({
            title: p.hardwares.length === 0 ? this.newTabTitle : p.hardwares.join('-'),
            id: p._id,
            hardwares: p.hardwares
          }))
        }
        this.tab = this.tabs[this.index]
      }
    },
    async created() {
      this.hardwares = this.getListHardware()
      await this.genTabs()
    }
  }
</script>

<style scoped lang="scss">
  .setting {
    padding: 8px 32px;

    ::v-deep .g-tab:before {
      display: none;
    }
  }

  .hardware {
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F0F0F0;
    border: 1px solid #979797;
    border-radius: 2px;
    color: #4D4D4E;
    font-size: 13px;
    line-height: 16px;
    cursor: pointer;

    &--selected {
      border-color: #1271ff;
      background: #E3F2FD;
    }
  }

  .configuration ::v-deep {
    padding-left: 0;

    .config {
      padding-top: 8px;
      padding-bottom: 4px;
    }
  }

  @media screen and (max-width: 1023px) {
    .setting {
      padding: 8px 16px;
    }
  }
</style>
