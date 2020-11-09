<template>
  <div class="category">
    <div v-for="(category, iGroup) in categories" :key="`cate_${iGroup}`"
         class="category-group">
      <div :class="['m-elevation-1', 'category-group__header', selectedCategory && selectedCategory._id === category._id && 'category-group__header--selected']"
          @click="selectCategory(category)">
        {{category.name}}
        <g-icon class="ml-1" size="14" v-if="category.icon" :color="category.iconColor">{{category.icon}}</g-icon>
      </div>
      <g-expand-transition>
        <div v-show="showingCategory(category)">
          <div v-for="(item, iItem) in category.items" :key="iItem"
              :class="['category-group__item', selectedCategory && selectedCategory._id === item._id && 'category-group__item--selected']"
              @click="selectCategory(item, category)">
            <g-icon size="12" class="mr-2">radio_button_unchecked</g-icon>
            <div>{{item.name}}</div>
          </div>
        </div>
      </g-expand-transition>
    </div>
  </div>
</template>

<script>


  export default {
    name: "PosRetailCategory",
    props: {

    },
    data() {
      return {
        categories: [
          { _id: 1, name: 'Favorite', icon: 'star', iconColor: '#FFCB3A' },
          { _id: 2, name: 'Sport',
            items: [
              { _id: 20, name: 'Football' },
              { _id: 21, name: 'Baseball' },
              { _id: 22, name: 'Basketball' },
            ]
          },
          { _id: 3, name: 'Food',
            items: [
              { _id: 30, name: 'Burger' },
              { _id: 31, name: 'Rice' },
              { _id: 32, name: 'Noodle' },
            ] },
          { _id: 4, name: 'Drink',
            items: [
              { _id: 40, name: 'Alcohol' },
              { _id: 41, name: 'Non-alcoholic' },
            ] },
          { _id: 5, name: 'Gift' },
          { _id: 6, name: 'Motobike',
            items: [
              { _id: 60, name: 'Standard' },
              { _id: 61, name: 'Cruiser' },
              { _id: 62, name: 'Sport' },
              { _id: 63, name: 'Scooter' },
            ] },
          { _id: 7, name: 'Clothes',
            items: [
              { _id: 70, name: 'Shirt' },
              { _id: 71, name: 'Dress' },
              { _id: 72, name: 'Jeans' },
              { _id: 73, name: 'Trousers' },
            ]
          },
        ],
        selectedCategory: null,
      }
    },
    computed: {

    },
    methods: {
      showingCategory(category) {
        if(!this.selectedCategory) return false
        return category.items && category.items.length > 0 && (this.selectedCategory._id === category._id || this.selectedCategory.parentId === category._id)
      },
      selectCategory(item, parent) {
        this.selectedCategory = item
        if(parent) {
          this.selectedCategory.parentId = parent._id
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .category {
    background-color: #E3F2FD;
    padding: 4px;

    &-group {
      background-color: white;
      border-radius: 2px;
      margin-bottom: 4px;

      &__header {
        display: flex;
        align-items: center;
        font-size: 14px;
        font-weight: 700;
        line-height: 18px;
        padding: 12px 16px;
        border-radius: 2px 2px 0 0;

        &--selected {
          background-color: #1271FF;
          color: white;
        }
      }

      &__item {
        display: flex;
        align-items: center;
        font-size: 14px;
        line-height: 18px;
        padding: 12px 16px;

        &--selected {
          background-color: #1271FF;
          color: white;

          .g-icon {
            color: white;
          }
        }
      }
    }
  }
</style>
