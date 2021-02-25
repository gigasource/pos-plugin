<template>
  <tr class="g-expansion">
    <td>
      <div class="g-expansion-header"
           @click="$emit('toggle')">
        <div class="flex-grow-1 pa-2" style="width: 52.5%; max-width: 52.5%">
          <p style="font-size: 15px">
            {{name}}
          </p>
          <p class="attributes"><span v-if="attributes">{{attributes}}</span></p>
        </div>
        <span class="w-10 pa-2 ta-center">{{unit}}</span>
        <span class="w-10 pa-2 ta-right">{{quantity}}</span>
        <div :class="{'w-12 pa-2 ta-right': true, ...price !== originalPrice && {'text__editted': true}}">
          <p>{{price}}</p>
          <p class="promotion-price" v-if="vDiscount > 0">{{originalPrice}}</p>
        </div>
        <div :class="{'py-2 pr-2 ta-right': true,
          ...price !== originalPrice && {'text-light-green': true}}"
        style="width: 15%; max-width: 15%;">
          <p class="fw-700">{{total}}</p>
          <p class="promotion-price" v-if="vDiscount > 0">{{originalTotal}}</p>
        </div>
      </div>

      <div class="g-expansion-content">
        <div class="col-4 row-flex">
          <div class="col-4 row-flex align-items-center justify-center">
            <g-btn :uppercase="false" icon small text-color="#1d1d26" style="margin: 8px 0" @click.stop="onDecreaseQuantityClick()">
              <g-icon>remove_circle_outline</g-icon>
            </g-btn>
          </div>
          <div class="col-4 row-flex align-items-center justify-center fs-large">
            <div class="w-80 row-flex align-items-center justify-center b-blue-accent-3 text-blue-accent-1 bg-white ba-thin" style="height: 32px">
              {{quantity}}
            </div>
          </div>
          <div class="col-4 row-flex align-items-center justify-center">
            <g-btn :uppercase="false" icon small text-color="#1d1d26" style="margin: 8px 0" @click.stop="onIncreaseQuantityClick()">
              <g-icon>add_circle_outline</g-icon>
            </g-btn>
          </div>
        </div>
        <div style="flex-grow: 1"></div>
        <g-btn :uppercase="false" text small text-color="#f44336" style="margin: 8px 0; letter-spacing: 0; font-size: 14px"
               @click.stop="onDecreaseQuantityClick(true)">
          <g-icon small class="mr-2">remove_circle</g-icon>
          Remove item
        </g-btn>
      </div>
    </td>
  </tr>
</template>

<script>
  export default {
    name: 'TableExpansionRow',
    props: {
      name: String,
      attributes: String,
      unit: String,
      quantity: [Number, String],
      price: [Number, String],
      originalPrice: [Number, String],
      total: [Number, String],
      originalTotal: [Number, String],
      vDiscount: [Number, String],
    },
    setup(props, context) {
      const onDecreaseQuantityClick = (remove = false) => context.emit(`click:remove`, remove)
      const onIncreaseQuantityClick = () => context.emit(`click:add`)

      return {
        onIncreaseQuantityClick,
        onDecreaseQuantityClick
      }
    }
  }
</script>

<style lang="scss" scoped>
  .g-expansion {
    .g-expansion-header {
      display: flex;
      color: #1c1c1c;
      line-height: 1.75;

      .attributes {
        color: #979797;
        text-transform: capitalize;
      }

      .promotion {
        color: #979797;
        margin-left: 8px;
        line-height: 1;

        &-price {
          color: #979797;
          text-decoration: line-through;
          margin-top: 4px;
          line-height: 1;
        }
      }
    }

    .g-expansion-content {
      display: none;
    }
  }

  .g-expansion__active {
    .g-expansion-header {
      background-color: #2979FF;
      color: white
    }

    .g-expansion-content {
      display: flex;
      background-color: #BBDEFB;
      transition-duration: 0.25s;
    }
  }

</style>
