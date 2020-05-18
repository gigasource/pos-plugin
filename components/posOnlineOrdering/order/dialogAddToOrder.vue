<template>
  <g-dialog v-model="internalValue" width="544" eager>
    <div class="dialog">
      <div class="dialog-header">
        <img v-if="showImage" alt :src="computedImg" class="dialog-header__thumbnail"/>
        <div class="ml-4">
          <p class="dialog-header__name">{{name}}</p>
          <p class="dialog-header__price">{{$t('common.currency')}}{{computedPrice}}</p>
        </div>
      </div>
      <div class="dialog-content">
        <div class="dialog-content__choice" v-for="(choice, index) in choices" :key="index">
          <div class="dialog-content__choice-name">
            <span class="fw-700">{{choice.name}}</span>
            <span class="text-red ml-1">{{choice.mandatory ? '*' : ''}}</span>
          </div>
          <div class="dialog-content__choice-option">
            <template v-if="choice.select === 'one' && choice.mandatory">
              <g-radio-group v-model="modifiers[index]">
                <g-radio v-for="option in choice.options" color="#536DFE" :value="option" :label="`${option.name} (${$t('common.currency')}${option.price})`"/>
              </g-radio-group>
            </template>
            <template v-else>
              <g-checkbox v-for="option in choice.options"
                          v-model="modifiers[index]"
                          color="#536DFE"
                          :value="option"
                          :label="`${option.name} (${$t('common.currency')}${option.price})`"/>
            </template>
          </div>
        </div>
        <div class="dialog-content__note">
          <p>Add note</p>
          <g-text-field-bs prepend-inner-icon="icon-note@16" :placeholder="`${$t('store.note')}...`" v-model="note"/>
        </div>
      </div>
      <div class="dialog-action">
        <div class="row-flex align-items-center" style="line-height: 2">
          <g-icon @click.stop="decreaseQuantity" color="#424242" size="28">remove_circle_outline</g-icon>
          <span style="margin-left: 4px; margin-right: 4px; min-width: 20px; text-align: center">{{quantity}}</span>
          <g-icon @click.stop="increaseQuantity" color="#424242" size="28">add_circle</g-icon>
        </div>
        <g-spacer/>
        <g-btn-bs width="80" height="100%" text-color="#424242" @click="internalValue = false">Cancel</g-btn-bs>
        <g-btn-bs width="80" height="100%" rounded text-color="#FFFFFF" background-color="#536DFE"
                  :disabled="!validateRequiredModifier" @click="submit">OK</g-btn-bs>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  import {getCdnUrl} from "../../Store/utils";

  export default {
    name: "dialogAddToOrder",
    props: {
      value: Boolean,
      _id: String,
      image: String,
      showImage: {
        type: Boolean,
        default: true
      },
      name: {
        type: String,
      },
      originalPrice: {
        type: Number,
      },
      price: {
        type: Number,
      },
      choices: {
        type: Array,
      },
    },
    data() {
      const modifiers = this.choices ? this.choices.map(c => c.select === 'one' ? null : []) : []
      return {
        modifiers,
        note: '',
        quantity: 1
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
      },
      computedImg() {
        const url = getCdnUrl(this.image)
        return url ? `${url}?w=60&h=60` : '/plugins/pos-plugin/assets/empty_dish.svg'
      },
      computedPrice() {
        let price = this.price
        for (const modifier of _.flatten(this.modifiers)) {
          price += modifier ? modifier.price : 0
        }
        return price
      },
      validateRequiredModifier() {
        if(!this.choices || this.choices.length === 0) return true
        for(let i = 0; i < this.choices.length; i++) {
          const choice = this.choices[i]
          const modifier = this.modifiers[i]
          if(choice.mandatory && (!modifier || (Array.isArray(modifier) && modifier.length === 0))) {
            return false
          }
        }
        return true
      }
    },
    watch: {
      internalValue(val) {
        if (val) {
          this.modifiers = this.choices ? this.choices.map(c => c.select === 'one' ? null : []) : []
        }
        this.note = ''
        this.quantity = 1
      }
    },
    methods: {
      decreaseQuantity() {
        if (this.quantity === 1)
          this.internalValue = false
        else
          this.quantity--
      },
      increaseQuantity() {
        this.quantity++
      },
      submit() {
        let modifiers = _.flatten(this.modifiers).map(m => ({
          ...m,
          quantity: 1
        }))
        this.$emit('add', {
          _id: this._id,
          quantity: this.quantity,
          note: this.note,
          modifiers,
        })
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
   padding: 24px 28px;
   display: flex;
   flex-direction: column;

   &-header {
     display: flex;
     align-items: center;
     border-bottom: 1px solid #D8D8D8;
     font-size: 18px;
     font-weight: 700;
     padding-bottom: 16px;

     &__name {
       color: #000000
     }

     &__price {
       color: #536DFE;
     }
   }

   &-content {
     font-size: 15px;
     overflow-y: auto;
     scrollbar-width: none; // firefox
     -ms-overflow-style: none; //edge

     &::-webkit-scrollbar {
       display: none;
     }

     &__choice {
       padding: 12px 0;

       &-name {
         margin-bottom: 12px;
       }

       &-option {
         display: flex;
         flex-wrap: wrap;
         align-items: center;

         .g-radio-wrapper,
         .g-checkbox-wrapper {
           margin: 4px 44px 4px 0;

           ::v-deep .g-radio,
           ::v-deep .g-checkbox {
             padding-left: 20px;
           }

           ::v-deep .g-radio-label,
           ::v-deep .g-checkbox-label {
             color: #424242;
             font-size: 15px;
             text-transform: capitalize;
             margin-left: 0;
           }

           ::v-deep .g-radio .g-radio-checkmark:before,
           ::v-deep .g-checkbox .g-checkbox-checkmark:before {
             font-size: 16px;
           }
         }

         ::v-deep .radio-group {
           display: flex;
           flex-wrap: wrap;
         }
       }
     }

     &__note {
       margin-bottom: 24px;

       .bs-tf-wrapper {
         margin: 8px 2px;

         ::v-deep .bs-tf-inner-input-group,
         ::v-deep .bs-tf-input {
           background: #fafafa;
           width: 100%;

           .bs-tf-input::placeholder {
             font-size: 12px;
             color: #9e9e9e;
           }
         }
       }
     }
   }

   &-action {
     display: flex;
     background: #efefef;
     margin: 0 -28px -24px -28px;
     padding: 12px 20px 12px 28px;
     border-radius: 0 0 4px 4px;
   }
 }

 @media screen and (max-width: 600px) {
   .dialog {
     &-content {
       &__choice {
         &-option {
           display: block;

           .g-checkbox-wrapper {
             padding-top: 2px;
             padding-bottom: 2px;
           }

           ::v-deep .radio-group {
             display: block;

             .g-radio-wrapper {
               padding-bottom: 4px;
             }
           }
         }
       }
     }
   }
 }
</style>
