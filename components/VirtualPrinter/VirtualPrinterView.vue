<template>
  <LazyLoadContainer
        class="virtualPrinterContainer"
        :container-style="{ maxHeight: '100%' }"
        :threshold="50"
        :do-load="loadMoreReports">
     <div class="virtualPrinter">
        <!-- header -->
        <div class="virtualPrinter__header">
          <g-btn border-radius="4" :uppercase="false" @click="selectMode('all')" class="virtualPrinter__header__btn">All</g-btn>
          <g-btn border-radius="4" :uppercase="false" @click="selectMode('bon')" class="virtualPrinter__header__btn">Bon</g-btn>
          <g-btn border-radius="4" :uppercase="false" @click="selectMode('receipt')" class="virtualPrinter__header__btn">Receipt</g-btn>
          <g-select text-field-component="GTextFieldBs" :items="zoom.availables" v-model="zoom.current" class="virtualPrinter__header__zoom"/>
          <g-select
              text-field-component="GTextFieldBs"
              :items="printerGroupModel"
              :value="printerGroupFilter"
              @input="selectPrinterGroup"
              class="virtualPrinter__header__printer"/>
          <g-spacer/>
          <g-btn border-radius="4" :uppercase="false" @click="dismiss" class="virtualPrinter__header__btn">Dismiss</g-btn>
        </div>
        <div :style="previewStyle">
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

  import LazyLoadContainer from './LazyLoadContainer';
  export default {
    name: 'VirtualPrinterView',
    components: { LazyLoadContainer },
    injectService: ['VirtualPrinterStore:(loading,filteredReports,dismiss,selectMode,printerGroups,selectPrinterGroup,printerGroupFilter,loadMoreReports)'],
    props: {},
    data: function () {
      return {
        zoom: {
          current: 75,
          availables: [
            { text: '75%',  value:  75 },
            { text: '100%', value: 100 },
            { text: '125%', value: 125 },
            { text: '150%', value: 150 }
          ],
        },
      }
    },
    computed: {
      printerGroupModel() {
        return this.printerGroups.map(v => ({ text: v.name, value: v._id }))
      },
      imgSrcs() {
        return this.filteredReports.map(x => 'data:image/png;base64, ' + x.imageContent)
      },
      receiptWidth() {
        return this.zoom.current * 4;
      },
      receiptPadding() {
        return Math.floor(15 * this.zoom.current / 100)
      },
      previewStyle() {
        return {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'transparent'
        }
      },
      imageWrapperStyle() {
        const pd = this.receiptPadding
        return {
          maxWidth: this.receiptWidth + pd * 2 + 'px',
          background: '#FFF',
          padding: `${pd}px ${pd}px ${pd*2}px ${pd}px`,
          marginTop: '15px',
          marginBottom: '15px',
        }
      },
      imgStyle() {
        return {
          width: this.receiptWidth + 'px',
        }
      },
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
      
      &__zoom {
        ::v-deep {
          .bs-tf-wrapper {
            margin-top: 0;
            margin-bottom: 0;
            background: #fff;
            border-radius: 4px;
            display: flex;
          }
          
          .bs-tf-inner-input-group {
            height: 36px;
          }
        }
      }
  
      &__printer {
        ::v-deep {
          .bs-tf-wrapper {
            margin-top: 0;
            margin-bottom: 0;
            background: #fff;
            border-radius: 4px;
            display: flex;
          }
      
          .bs-tf-inner-input-group {
            height: 36px;
            min-width: 80px;
          }
        }
      }
    }
  }
</style>
