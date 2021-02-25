<template>
  <g-dialog v-model="internalValue" width="50%" eager>
    <div class="dialog-sort w-100">
      <div class="dialog-sort__title">Sort by</div>
      <div class="dialog-sort__content">
        <div v-for="(option, text) in items" :class="['dialog-sort__content-item', tempOption === option && 'dialog-sort__content-item--active']" @click="select(option)">
          {{text}}
          <g-icon size="16" svg v-if="tempOption !== option">icon-arrow-up-down</g-icon>
          <g-icon size="16" svg v-else>{{tempValue === 1 ? 'icon-arrow-up' : 'icon-arrow-down'}}</g-icon>
        </div>
      </div>
      <div class="dialog-sort__action">
        <g-btn :uppercase="false" text @click="internalValue = false" outlined width="120" class="mr-2">
          {{$t('ui.cancel')}}
        </g-btn>
        <g-btn :uppercase="false" text @click="submit" backgroundColor="#2979FF" text-color="#FFFFFF"
               width="120">
          {{$t('ui.ok')}}
        </g-btn>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: "dialogSort",
    props: {
      modelValue: Boolean
    },
    data() {
      return {
        // internalValue: false,
        items: {
          'Name': 'name',
          'Date added': 'dateAdded',
          'Price': 'price'
        },
        sortOption: '',
        sortValue: 0,
        tempOption: '',
        tempValue: 0
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.modelValue
        },
        set(val) {
          if(val === false) {
            this.tempOption = this.sortOption
            this.tempValue = this.sortValue
          }
          this.$emit('update:modelValue', val)
        }
      }
    },
    methods: {
      select(option) {
        if (this.tempOption !== option)
          this.tempValue = 0
        this.tempOption = option
        this.increaseValue()
      },
      increaseValue() {
        if (this.tempValue === 0)
           this.tempValue = 1
        else if (this.tempValue === 1)
           this.tempValue = -1
        else if (this.tempValue === -1) {
          this.tempValue = 0
          this.tempOption = ''
        }
      },
      submit() {
        let sort = {}
        this.sortOption = this.tempOption
        this.sortValue = this.tempValue
        if (this.sortOption && this.sortValue !== 0)
          _.set(sort, this.sortOption, this.sortValue)
        this.$emit('submit', sort)
        this.internalValue = false
      }
    }
  }
</script>

<style scoped lang="scss">
  .dialog-sort {
    background-color: white;
    padding: 24px;

    &__title {
      font-weight: 700;
      margin: 12px 0;
    }

    &__content {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-gap: 8px;
      margin: 24px 0 48px;

      &-item {
        background: #F0F0F0;
        border: 1px solid #DBDBDB;
        border-radius: 2px;
        padding: 8px;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        &--active {
          color: #2979ff;
          border-color: currentColor;
          font-weight: 600;
        }
      }
    }

    &__action {
      display: flex;
      justify-content: flex-end;
    }
  }
</style>
