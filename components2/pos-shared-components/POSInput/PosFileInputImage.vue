<template>
  <div class="g-image-input__wrapper">
    <input style="display: none" type="file" ref="fileInput" @change="changeImg" accept="image/*"/>
    <div class="g-image-input__label">{{label}}</div>
    <div :class="['g-image-input', src ? 'no-bg' : 'default-bg']" @click="inputClick">
      <g-icon v-if="src" class="g-image-input__icon" @click.stop="clearImg">mdi-close</g-icon>
      <img alt class="g-image-input__demo" :src="src">
    </div>
  </div>
</template>

<script>
  export default {
    name: "PosFileInputImage",
    props: {
      modelValue: null,
      label: String
    },
    computed: {
      src: {
        get() {
          return this.modelValue;
        },
        set(val) {
          this.$emit('update:modelValue', val);
        }
      }
    },
    methods: {
      inputClick() {
        this.$refs['fileInput'].click();
      },
      clearImg() {
        this.src = null;
      },
      changeImg(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          this.src = reader.result;
        }
        if(file)
          reader.readAsDataURL(file)
      }
    },
  }
</script>

<style scoped lang="scss">
    .g-image-input {
      height: 193px;
      width: 270px;
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;

      &.default-bg {
        background-image: url("./FileInputImage.png");
        background-size: cover;
      }

      &.no-bg {
        background: #eee;
        border: 1px solid #bdbdbd;
        border-radius: 6px;
      }

      &__wrapper {
        margin-top: 30px;
        margin-left: 4px;
      }

      &__label {
        font-weight: 400;
        font-size: 13px;
        line-height: 16px;
        margin-bottom: 8px;
      }

      &__icon {
        position: absolute;
        right: 4px;
        top: 4px;
        z-index: 2;
      }

      &__demo {
        width: 50%;
      }
    }
</style>
