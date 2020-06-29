<template>
  <div class="multiple-printer">
    <div class="multiple-printer__title">{{$t('setting.multiplePrinter')}}</div>
    <div class="multiple-printer__content">
      <div class="row-flex mb-3">
        <g-switch v-model="multiple"/>
        <div>
          <p class="fw-700 fs-small">{{$t('setting.useMultiplePrinter')}}</p>
          <p class="text-grey-darken-1 fs-small">({{$t('setting.onePrinterNote')}})</p>
        </div>
      </div>
      <div class="row-flex justify-between align-items-center">
        <p class="fw-700">{{$t('setting.printerName')}}</p>
        <g-btn-bs class="text-indigo-accent-2 fw-700" @click="dialog.newPrinter = true">+ {{$t('setting.newPrinter')}}</g-btn-bs>
      </div>
      <div class="multiple-printer__printer">
        <g-chip v-for="(printer, i) in printers" :key="i" close close-icon="icon-close@14" label @close="removePrinter(printer)">
          {{printer}}
        </g-chip>
      </div>
      <p class="i fs-small mt-2">{{$t('setting.printerNameNote')}}</p>
    </div>
    <g-dialog v-model="dialog.newPrinter" width="40%" eager>
      <div class="dialog">
        <div class="dialog__title">Add New Printer</div>
        <g-text-field-bs label="Name" v-model="name" placeholder="e.g: Food printer"/>
        <div class="dialog__buttons">
          <g-btn-bs width="100" text-color="#424242" @click="closeDialog">Cancel</g-btn-bs>
          <g-btn-bs width="100" background-color="#536DFE" text-color="white" @click="addPrinter">OK</g-btn-bs>
        </div>
      </div>
    </g-dialog>
  </div>
</template>

<script>
  import _ from 'lodash'
  
  export default {
    name: "MultiplePrinter",
    props: {
      store: Object,
    },
    data() {
      return {
        dialog: {
          newPrinter: false
        },
        name: ''
      }
    },
    computed: {
      multiple: {
        get() {
          return this.store.useMultiplePrinters
        },
        set(value) {
          this.$emit('update', { useMultiplePrinters: value })
        }
      },
      printers() {
        return this.store.printers
      }
    },
    methods: {
      closeDialog() {
        this.name = ''
        this.dialog.newPrinter = false
      },
      addPrinter() {
        this.printers.push(this.name)
        this.name = ''
        this.dialog.newPrinter = false
        this.$emit('update', { printers: this.printers })
      },
      removePrinter(printer) {
        const index = this.printers.findIndex(p => p === printer)
        this.printers.splice(index, 1)
        this.$emit('update', { printers: this.printers })
      }
    }
  }
</script>

<style scoped lang="scss">
  .multiple-printer {
    font-size: 14px;

    &__title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    &__content {
      width: 70%;
      background: white;
      border-radius: 4px;
      padding: 30px;
      font-size: 15px;

      .g-switch-wrapper {
        margin-top: 4px;
        margin-right: 16px;
      }
    }

    &__printer {
      background: #FAFAFA;
      border: 1px solid #EFEFEF;
      border-radius: 4px;
      display: flex;
      flex-wrap: wrap;
      min-height: 40px;

      .g-chip {
        color: #1d1d26
      }
    }
  }

  .dialog {
    width: 100%;
    background: white;
    padding: 24px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;

    &__title {
      font-size: 20px;
      font-weight: 600;
      color: #212121;
      margin-bottom: 12px;
      margin-left: 4px;
      align-self: flex-start;
    }

    &__buttons {
      display: flex;
      align-self: flex-end;
      margin-top: 24px;
    }
  }
</style>
