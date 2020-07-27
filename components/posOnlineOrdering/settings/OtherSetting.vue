<template>
  <div class="other">
    <div class="other__title">Other Setting</div>
    <div class="other__main">
      <div class="other__main--left">
        <p>Digital menu embed script</p>
        <g-textarea rows="8" outlined no-resize v-model="script"/>
        <div class="row-flex justify-end">
          <g-btn-bs background-color="#1271ff" @click="uploadScript">Upload</g-btn-bs>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: "OtherSetting",
    props: {},
    data() {
      return {
        script: ''
      }
    },
    methods: {
      uploadScript() {
        this.$emit('update', {digitalMenuScript: this.script})
      }
    }
  }
</script>

<style scoped lang="scss">
  .other {

    &__title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
    }

    &__main {
      display: flex;

      &--left,
      &--right {
        background-color: #FFF;
        border-radius: 5px;
        padding: 24px;
        margin-bottom: 24px;
      }

      &--left {
        flex: 0 0 calc(80% - 12px);
        margin-right: 12px;

        .g-textarea {
          margin-right: 4px;
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
              user-select: text !important;
              line-height: 1.2 !important;
            }

            .g-tf-append__inner {
              display: none;
            }
          }
        }
      }
    }
  }
</style>
