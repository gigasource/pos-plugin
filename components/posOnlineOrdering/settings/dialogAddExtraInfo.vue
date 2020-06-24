<template>
  <g-dialog v-model="internalValue" width="531" eager>
    <div class="dialog">
      <div class="dialog-title">Extra information</div>
      <div class="dialog-content">
        <g-checkbox color="#536DFE" v-model="allergic" :label="$t('store.allergic')"/>
        <div :class="['allergic-table', !allergic && 'disabled']">
          <g-checkbox color="#536DFE" v-model="types" :label="$t('store.eggs')" value="eggs"/>
          <g-checkbox color="#536DFE" v-model="types" :label="$t('store.fish')" value="fish"/>
          <g-checkbox color="#536DFE" v-model="types" :label="$t('store.milk')" value="milk"/>
          <g-checkbox color="#536DFE" v-model="types" :label="$t('store.celery')" value="celery"/>
          <g-checkbox color="#536DFE" v-model="types" :label="$t('store.cereal')" value="cereal"/>
          <g-checkbox color="#536DFE" v-model="types" :label="$t('store.nuts')" value="nuts"/>
          <g-checkbox color="#536DFE" v-model="types" :label="$t('store.peanuts')" value="peanuts"/>
          <g-checkbox color="#536DFE" v-model="types" :label="$t('store.sesame')" value="sesame"/>
          <g-checkbox color="#536DFE" v-model="types" :label="$t('store.crustaceans')" value="crustaceans"/>
          <g-checkbox color="#536DFE" v-model="types" :label="$t('store.lupin')" value="lupin"/>
          <g-checkbox color="#536DFE" v-model="types" :label="$t('store.molluscs')" value="molluscs"/>
          <g-checkbox color="#536DFE" v-model="types" :label="$t('store.mustard')" value="mustard"/>
          <g-checkbox color="#536DFE" v-model="types" :label="$t('store.soya')" value="soya"/>
          <g-checkbox color="#536DFE" v-model="types" :label="$t('store.sulphur')" value="sulphur"/>
        </div>
        <g-checkbox color="#536DFE" v-model="spicy" :label="$t('store.spicy')"/>
        <g-checkbox color="#536DFE" v-model="vegeterian" :label="$t('store.vegeterian')"/>
      </div>
      <div class="dialog-action">
        <g-btn-bs text-color="#424242" @click="internalValue = false">{{$t('setting.cancel')}}</g-btn-bs>
        <g-btn-bs text-color="white" background-color="#536DFE" min-width="80" @click="submit">{{$t('setting.save')}}</g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: "dialogAddExtraInfo",
    props: {
      value: Boolean,
      mark: Object,
    },
    data() {
      let allergic = this.mark.allergic.active || false,
          types = this.mark.allergic.types || [],
          spicy = this.mark.spicy.active || false,
          vegeterian = this.mark.vegeterian.active || false
      return {
        allergic,
        types,
        spicy,
        vegeterian
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.$emit('input', val)
        }
      }
    },
    methods: {
      submit() {
        let mark = {
          allergic: {
            active: !!this.allergic,
            types: this.types,
            notice: ''
          },
          spicy: {
            active: !!this.spicy,
            notice: ''
          },
          vegeterian: {
            active: !!this.vegeterian,
            notice: ''
          }
        }
        this.$emit('save', mark)
        this.internalValue = false
      }
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
      font-weight: 600;
      font-size: 24px;
      margin-bottom: 16px;
      color: #212121;
    }

    &-icon--close {
      position: absolute;
      top: 16px;
      right: 16px
    }

    &-content {
      .g-checkbox-wrapper {
        margin: 12px 0;

        ::v-deep {
          .g-checkbox {
            padding-left: 20px;

            &-label {
              font-size: 14px;
              font-weight: 700;
              color: black;
            }

            &-checkmark:before {
              top: 1px;
            }
          }
        }
      }

      .allergic-table {
        border: 0.5px solid #9E9E9E;
        border-radius: 2px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-column-gap: 16px;
        padding: 8px 16px;

        .g-checkbox-wrapper {
          margin: 4px 0;

          ::v-deep .g-checkbox-label {
            font-weight: 400;
          }
        }
      }
    }

    &-action {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }
</style>
