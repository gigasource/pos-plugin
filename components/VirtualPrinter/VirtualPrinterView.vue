<template>
  <LazyLoadContainer
        class="virtualPrinterContainer"
        :container-style="{ maxHeight: '100%' }"
        :threshold="50"
        :do-load="loadMoreReports">
     <div class="virtualPrinter">
        <!-- header -->
        <div class="virtualPrinter__header" @touchend.stop="()=>{}">
          <g-btn border-radius="4" :uppercase="false" @click="selectMode('all')" class="virtualPrinter__header__btn">All</g-btn>
          <g-btn border-radius="4" :uppercase="false" @click="selectMode('bon')" class="virtualPrinter__header__btn">Bon</g-btn>
          <g-btn border-radius="4" :uppercase="false" @click="selectMode('receipt')" class="virtualPrinter__header__btn">Receipt</g-btn>
          <g-select
              text-field-component="GTextFieldBs"
              :items="state.zoom.availables"
              v-model="state.zoom.current"
              class="virtualPrinter__header__select"
              style="min-width: 76px"/>
          <g-select
              text-field-component="GTextFieldBs"
              :items="printerGroupModel"
              :value="virtualPrinterStoreState.printerGroupFilter"
              @input="selectPrinterGroup"
              class="virtualPrinter__header__select"
              style="min-width: 80px"/>
          <g-spacer/>
          <g-btn border-radius="4" :uppercase="false" @click="dismiss" class="virtualPrinter__header__btn">Dismiss</g-btn>
        </div>
        <div :style="{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'transparent'
        }">
          <div v-if="imgSrcs && imgSrcs.length" v-for="(imgSrc, i) in imgSrcs" :key="i" :style="imageWrapperStyle">
            <img :src="imgSrc" draggable="false" :style="imgStyle"/>
          </div>
          <div v-else>
            0 report found!
          </div>
        </div>
      </div>
    </LazyLoadContainer>
</template>

<script>
  // TODO:
  //  - lazy container reload when switch between report type
  import VirtualPrinterStore from '../Store/virtualPrinterStore';
  import LazyLoadContainer from './LazyLoadContainer';
  import { reactive, computed } from 'vue'
  
  export default {
    name: 'VirtualPrinterView',
    components: { LazyLoadContainer },
    props: {},
    setup(props, context) {
      const state = reactive({
        zoom: {
          current: 75,
          availables: [
            { text: '75%',  value:  75 },
            { text: '100%', value: 100 },
            { text: '125%', value: 125 },
            { text: '150%', value: 150 }
          ],
        },
      })
      
      const {
        // data
        state: virtualPrinterStoreState,
        // computed
        filteredReports,
        // methods
        loadReports,
        loadMoreReports,
        loadReportCount,
        loadPrinterGroups,
        dismiss,
        setReports,
        selectMode,
        selectPrinterGroup,
      } = VirtualPrinterStore.getInstance()
      
      
      const printerGroupModel = computed(() => {
        return virtualPrinterStoreState.printerGroups.map(v => ({ text: v.name, value: v._id }))
      })
      
      const imgSrcs = computed(() => {
        return filteredReports.value.map(x => 'data:image/png;base64, ' + x.imageContent)
      })

      const receiptWidth = computed(() => {
        return state.zoom.current * 4;
      })
      
      const receiptPadding = computed(() => {
        return Math.floor(15 * state.zoom.current / 100)
      })
      
      const imageWrapperStyle = computed(() => {
        const pd = receiptPadding.value
        return {
          maxWidth: receiptWidth.value + pd * 2 + 'px',
          background: '#FFF',
          padding: `${pd}px ${pd}px ${pd*2}px ${pd}px`,
          marginTop: '15px',
          marginBottom: '15px',
        }
      })
      
      const imgStyle = computed(() => ({
        width: receiptWidth.value + 'px',
      }))
      
      
      // created
      loadReports()
      
      
      return {
        // cpt
        state,
        printerGroupModel,
        imgSrcs,
        receiptWidth,
        imageWrapperStyle,
        imgStyle,
        // from inject
        virtualPrinterStoreState,
        selectMode,
        loadMoreReports,
        selectPrinterGroup,
        dismiss,
      }
    },
  }
</script>

<style scoped lang="scss">
  $headerHeight: 46px;
  
  .virtualPrinterContainer {
    background-image: url('/plugins/pos-plugin/assets/out.png');
    background-attachment: fixed;
    min-height: 100%;
  }
  
  .virtualPrinter {
    
    &__header {
      height: $headerHeight;
      display: flex;
      flex-direction: row;
      align-items: center;
      background-color: rgba(0,0,0,0.3);
      padding: 10px;
      
      &__btn {
        margin-right: 5px;
      }
      
      &__select {
        box-shadow: 0px 3px 1px -2px rgba(0, 0, 0, 0.2), 0px 2px 2px 0px rgba(0, 0, 0, 0.14), 0px 1px 5px 0px rgba(0, 0, 0, 0.12);
        margin-right: 5px;
      }
  
      ::v-deep {
        .bs-tf-wrapper {
          margin: 0;
          background-color: #f5f5f5;
          border-radius: 4px;
          display: flex;
          width: 100%;
        }
    
        .bs-tf-input-group {
          width: 100%;
        }
        
        .bs-tf-inner-input-group {
          height: 36px;
          padding-left: 8px;
          padding-right: 0;
          flex-wrap: nowrap;
          border-width: 0;
  
          .input, .bs-tf-append-inner {
            cursor: pointer;
          }
        }
      }
    }
  }
</style>
