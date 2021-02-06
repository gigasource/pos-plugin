<template>
  <g-dialog v-model="dialog" overlay-color="#6b6f82" overlay-opacity="0.95" width="40%" eager>
    <g-card class="w-100">
      <g-card-title>
        {{$t('ui.confirmation')}}
      </g-card-title>
      <g-card-text>
        <span>{{$t("settings.deletePrompt")}} </span>
        <span v-if="computedType">{{computedType}} </span>
        <b v-if="computedLabel">"{{computedLabel}}"</b>?
      </g-card-text>
      <g-card-actions>
        <g-btn-bs border-color="#1d1d26" @click="dialog = false">{{$t('ui.cancel')}}</g-btn-bs>
        <g-btn-bs background-color="red lighten 2" text-color="white" @click="submit">{{$t('ui.delete')}}</g-btn-bs>
      </g-card-actions>
    </g-card>
  </g-dialog>
</template>

<script>
  export default {
    name: 'dialogConfirmDelete',
    props: {
      modelValue: Boolean,
      type: String,
      label: [String, Number],
    },
    data() {
      return {
        //for open method
        internalType: null,
        internalLabel: null,
        internalValue: null,
      }
    },
    emits: ['update:modelValue', 'submit'],
    computed: {
      dialog: {
        get() {
          if (this.modelValue)
            return this.modelValue;
          else
            return this.internalValue
        },
        set(val) {
          if(!val) {
            this.internalType = null;
            this.internalLabel = null;
          }
          this.$emit('update:modelValue', val);
          this.internalValue = val;
        }
      },
      computedType() {
        if (this.type) {
          return this.type
        }
        if (this.internalType) {
          return this.internalType
        }
        return null
      },
      computedLabel() {
        if (this.label) {
          return this.label
        }
        if (this.internalLabel) {
          return this.internalLabel
        }
        return null
      }
    },
    methods: {
      submit() {
        this.$emit('submit');
        this.dialog = false;
      },
      open(type, label) {
        this.internalType = type;
        this.internalLabel = label;
        this.dialog = true;
      }
    }
  }
</script>

<style scoped lang="scss">
  .g-card {
    .g-card-title,
    .g-card-text {
      justify-content: center;
      text-align: center;
      color: #1d1d26;
    }

    .g-card-text {
      padding: 32px 64px;
    }

    .g-card-actions {
      justify-content: flex-end;

      .g-btn {
        min-width: 120px !important;
      }

      .g-btn__outlined {
        border: 1px solid #979797;
        color: #1d1d26;
      }
    }
  }
</style>
