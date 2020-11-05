<template>
  <g-dialog v-model="internalValue" eager width="584">
    <div class="dialog">
      <div class="dialog-title">GDPdU/GoBD Data Exportieren</div>
      <g-icon class="dialog-icon--close" color="#757575" @click="internalValue = false">close</g-icon>
      <div class="dialog-content">
        <div class="dialog-content__main">
          <div class="dialog-content__title span-2">Type</div>
          <div :class="['dialog-content__type', type === 'GoDB' && 'dialog-content__type--selected']" @click="type = 'GoDB'">GoDB</div>
          <div :class="['dialog-content__type', type === 'DSFINV' && 'dialog-content__type--selected']" @click="type = 'DSFINV'">DSFINV</div>
          <div class="dialog-content__title">Von</div>
          <div class="dialog-content__title">Bis</div>
          <g-text-field-bs v-model="von"/>
          <g-text-field-bs v-model="bis"/>
          <div class="dialog-content__title span-2">Exportieren zu:</div>
          <g-btn-bs v-if="saving" class="span-2" icon="icon-floppy-disk_white" background-color="#1271FF">Saving ... (Bitte warten)!</g-btn-bs>
          <g-btn-bs v-else @click="saving = true" icon="icon-floppy-disk" background-color="#F0F0F0" border-color="#C9C9C9" text-color="black">Local</g-btn-bs>
        </div>
        <img alt src="/plugins/pos-plugin/assets/image/GoBD.png"/>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: "dialogExportData",
    props: {
      value: Boolean,
    },
    data() {
      return {
        type: '',
        von: '',
        bis: '',
        saving: false
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value;
        },
        set(val) {
          this.$emit('input', val)
        }
      }
    },
    methods: {

    }
  }
</script>

<style scoped lang="scss">
  .dialog {
    width: 100%;
    background: white;
    border-radius: 4px;
    padding: 24px;
    position: relative;

    &-title {
      font-weight: 700;
      font-size: 20px;
      line-height: 25px;
      margin-bottom: 24px;
    }

    &-icon--close {
      position: absolute;
      top: 16px;
      right: 16px;
    }

    &-content {
      display: flex;
      align-items: flex-start;

      &__main {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 16px 40px 16px 40px 16px 40px;
        grid-gap: 8px;
        margin-right: 16px;

        .span-2 {
          grid-column: span 2;
        }

        .bs-tf-wrapper {
          margin: 0;
          width: 100%;

          ::v-deep .bs-tf-input-group {
            background-color: #F0F0F0;
            border-color: #C9C9C9;

            .bs-tf-input {
              background-color: #F0F0F0;
            }
          }
        }

        .g-btn-bs {
          margin: 0;
          font-size: 14px;
        }
      }

      &__title {
        font-size: 13px;
        font-weight: 700;
      }

      &__type {
        background: #EFEFEF;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;

        &--selected {
          background-color: #1271FF;
          color: white;
        }
      }
    }
  }
</style>
