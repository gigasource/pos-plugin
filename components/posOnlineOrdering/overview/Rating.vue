<template>
 <div class="rating">
   <g-icon class="rating-icon" :size="iconSize" v-for="i in full" :color="color">{{iconFull}}</g-icon>
   <g-icon class="rating-icon" :size="iconSize" v-if="half" :color="color">{{iconHalf}}</g-icon>
   <g-icon class="rating-icon" :size="iconSize" v-for="i in empty" :color="color">{{iconEmtpy}}</g-icon>
 </div>
</template>

<script>
  export default {
    name: "Rating",
    props: {
      iconFull: {
        type: String,
        default: 'star'
      },
      iconHalf: {
        type: String,
        default: 'star_half'
      },
      iconEmtpy: {
        type: String,
        default: 'star_outline'
      },
      iconSize: {
        type: [Number, String],
        default: 24
      },
      color: {
        type: String,
        default: 'black'
      },
      size: {
        type: [Number, String],
        default: 5
      },
      value: [Number, String]
    },
    computed: {
      full() {
        return Math.floor(+this.value)
      },
      half() {
        return !Number.isInteger(+this.value)
      },
      empty() {
        const empty = +this.size - this.full
        if(this.half) return empty - 1
        return empty
      }
    }
  }
</script>

<style scoped lang="scss">
  .rating {
    display: flex;
    align-items: center;

    &-icon {
      margin-right: 2px;
    }
  }
</style>
