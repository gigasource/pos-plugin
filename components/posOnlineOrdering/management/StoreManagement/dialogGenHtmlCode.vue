<template>
  <g-dialog v-model="internalValue" width="539">
    <div class="dialog">
      <div class="dialog-title">HTML Code</div>
      <g-icon class="dialog-icon--close" size="20" @click="internalValue = false">icon-close</g-icon>
      <div class="dialog-content">
        <div class="mt-3">
          <div class="block-code">{{code}}</div>
          <g-btn-bs style="margin-left: 0; margin-top: 8px" icon="icon-chain-blue@14" text-color="indigo accent-2" @click="copyCode">Copy Code</g-btn-bs>
        </div>
      </div>
    </div>
  </g-dialog>
</template>

<script>
  import { copyToClipboard, generateEmbededScript } from "../../../Store/utils.js"
  
  export default {
    name: "dialogGenHtmlCode",
    props: {
      id: String,
      locale: String,
      type: String,
      value: Boolean,
    },
    data() {
      return {}
    },
    computed: {
      internalValue: {
        get() {
          return this.value;
        },
        set(val) {
          this.$emit('input', val)
        }
      },
      code() {
        return generateEmbededScript({ type: this.type, locale: this.locale, id: this.id })
      }
    },
    methods: {
      async copyCode() {
        await copyToClipboard(this.code)
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
       height: 250px;
       border: 1px solid #9e9e9e;
       border-radius: 2px;
       overflow-y: auto;
       padding: 10px;
     }
   }
 }
</style>
