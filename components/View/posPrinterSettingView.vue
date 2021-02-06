<template>
  <div class="pos-printer-setting-view">
    <pos-printer-setting-sidebar
        class="pos-printer-setting-view__sidebar"
        v-model:view="view"
        @deleteMenu="dialog.confirmDelete = true"
    />
    <content-render class="pos-printer-setting-view__content" v-model:view="view">
      <template v-slot:printer="{id, type, name}">
        <pos-printer-setting :id="id" :type="type" :name="name"/>
      </template>
      <template v-slot:multiple="{id, type, name}">
        <pos-printer-setting-for-multiple :id="id" :type="type" :name="name"/>
      </template>
      <template v-slot:general>
        <pos-printer-setting-general />
      </template>
    </content-render>
    <dialog-confirm-delete
        v-model="dialog.confirmDelete"
        @submit="handleConfirmSubmit"/>
  </div>
</template>
<script>
  import PosPrinterSettingSidebar from '../posPrinterSetting/PosPrinterSettingSidebar';
  import ContentRender from '../common/ContentRender';
  import PosPrinterSetting from '../posPrinterSetting/PosPrinterSetting';
  import PosPrinterSettingForMultiple from '../posPrinterSetting/PosPrinterSettingForMultiple';
  import PosPrinterSettingGeneral from '../posPrinterSetting/PosPrinterSettingGeneral';
  export default {
    name: 'posPrinterSettingView',
    components: { PosPrinterSettingGeneral, PosPrinterSettingForMultiple, PosPrinterSetting, ContentRender, PosPrinterSettingSidebar },
    props: {},
    injectService: ['SettingsStore:(selectedPrinterMenu,deleteGroupPrinter)'],
    data: function () {
      return {
        view: null,
        dialog: {
          confirmDelete: false
        },
        // inject
        selectedPrinterMenu: null
      }
    },
    computed: {},
    methods: {
      handleConfirmSubmit() {
        this.deleteGroupPrinter(this.selectedPrinterMenu.id)
      },
      // inject
      deleteGroupPrinter() {
        console.error('SettingsStore:deleteGroupPrinter was not injected')
      }
    }
  }
</script>
<style scoped lang="scss">
  .pos-printer-setting-view {
    display: grid;
    grid-template-columns: 256px 1fr;
    grid-template-rows: 100%;
    height: 100%;

    &__sidebar {
      grid-area: 1 / 1 / 2 / 2;
    }

    &__content {
      grid-area: 1 / 2 / 2 / 3;
    }

  }
</style>
