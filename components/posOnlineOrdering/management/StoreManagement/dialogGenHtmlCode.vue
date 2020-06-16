<template>
  <g-dialog v-model="internalValue" width="539">
    <div class="dialog">
      <div class="dialog-title">HTML Code</div>
      <g-icon class="dialog-icon--close" size="20" @click="internalValue = false">icon-close</g-icon>
      <div class="dialog-content">
        <div class="row-flex align-items-end">
          <g-autocomplete text-field-component="GTextFieldBs" label="Store" deletable-chips :items="listStores" v-model="alias"/>
          <g-radio-group name="type" v-model="type">
            <g-radio small color="indigo accent-2" value="order" label="Online Order"/>
            <g-radio small color="indigo accent-2" value="reservation" label="Reservation"/>
            <g-btn-bs :disabled="!type" style="width: 100%; margin: 0" background-color="indigo accent-2" text-color="white" @click.stop="generateHtmlCode">Generate</g-btn-bs>
          </g-radio-group>
        </div>
        <div class="mt-3">
          <div class="block-code">{{code}}</div>
          <g-btn-bs style="margin-left: 0; margin-top: 8px" icon="icon-chain-blue@14" text-color="indigo accent-2" @click="copyCode">Copy Code</g-btn-bs>
        </div>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  export default {
    name: "dialogGenHtmlCode",
    props: {
      stores: Array,
      value: Boolean,
    },
    data() {
      return {
        alias: null,
        type: null,
        code: ''
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value;
        },
        set(val) {
          this.$emit('input', val)
          this.alias = null
          this.type = null
        }
      },
      listStores() {
        return this.stores && this.stores.map(s => ({
          text: s.name ? s.name : s.settingName,
          value: s.alias
        }))
      },
    },
    methods: {
      generateHtmlCode() {
        this.code = ''
        if(this.type === 'order') {
          const storeUrl = [location.origin, 'store', this.alias].join('/');
          const store = this.stores.find(s => s.alias === this.alias)
          const image = store.country && store.country.locale.includes('de') ? 'online-order-de.svg' : 'online-order.svg'
          const fallbackContent = store.country && store.country.locale.includes('de') ? 'Online Bestellen' : 'Online Order'
          this.code = `<div id="webshop-embed-btn" class="webshop-embed-btn" data-url="${storeUrl}" data-width="120">
                  <object style="pointer-events: none; width: 120px" type="image/svg+xml" data="https://pos.gigasource.io/cms-files/files/view/images/${image}">${fallbackContent}</object>
                </div>
                <script type="application/javascript" src="https://cdn.pos.gigasource.io/cms-files/files/view/js-scripts/webshop-embed.js"><\/script>`
        } else if(this.type === 'reservation') {
          const reservationUrl = [location.origin, 'reservation', this.alias].join('/');
          this.code = `<div id="reservation-embed-btn" class="reservation-embed-btn" data-url="${reservationUrl}" data-width="120">Reservation</div><script type="application/javascript" src="https://cdn.pos.gigasource.io/cms-files/files/view/js-scripts/reservation-embed.js"><\/script>`
        }
      },
      async copyCode() {
        await navigator.clipboard.writeText(this.code)
      },
    }
  }
</script>

<style scoped lang="scss">
 .dialog {
   background: white;
   width: 100%;
   padding: 24px;
   border-radius: 4px;
   position: relative;

   &-title {
     font-size: 24px;
     font-weight: 600;
     margin-top: 8px;
     margin-bottom: 8px;
   }

   &-icon--close {
     position: absolute;
     top: 24px;
     right: 24px;
   }

   &-content {
     .g-autocomplete {
       flex: 1;

       ::v-deep .bs-tf-wrapper {
         margin: 0 24px 0 0;
         width: auto;

         .bs-tf-inner-input-group {
           border-color: #9e9e9e;
           border-radius: 2px;
           padding: 0 6px;

           .input {
             height: 90px;
             align-items: flex-start;

             .g-chip {
               border-radius: 2px;
             }
           }
         }

         .bs-tf-label {
           font-size: 13px;
           font-weight: 700;
         }

         .bs-tf-append-inner {
           display: none;
         }
       }
     }

     .block-code {
       height: 100px;
       border: 1px solid #9e9e9e;
       border-radius: 2px;
       overflow-y: auto;
       padding: 0 24px;
       text-align: center;
     }
   }
 }
</style>
