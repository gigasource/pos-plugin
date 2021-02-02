<template>
  <div style="height: 100%">
    <g-grid-item-selector :cols="cols" :items="internalNewItems" :rows="rows" multiple return-object v-model="internalValue">
      <template #default="{toggleSelect, item, index}">
        <slot :index="index" :item="item" :toggleSelect="toggleSelect">
          <g-btn :uppercase="false" :style="{gridRow: item.row[0] + '/' + item.row[1], gridColumn: item.col[0] + '/' + item.col[1], display: mergedButtons.indexOf(item) >= 0 ? 'none' : '', backgroundColor: item.style.backgroundColor, textColor: item.style.textColor}" @click="toggleSelect(item)" height="100%" width="100%">
            {{item.text}}
          </g-btn>
        </slot>
      </template>
      <template #selected="{toggleSelect, item, index}">
        <slot :index="index" :item="item" :toggleSelect="toggleSelect" name="selected">
          <g-btn :uppercase="false" :style="{gridRow: item.row[0] + '/' + item.row[1], gridColumn: item.col[0] + '/' + item.col[1], display: mergedButtons.indexOf(item) >= 0 ? 'none' : '', backgroundColor: item.style.backgroundColor, textColor: item.style.textColor, opacity: 0.54}" @click="toggleSelect(item)" height="100%" width="100%">
            {{item.text}}
          </g-btn>
        </slot>
      </template>
    </g-grid-item-selector>

  </div>
</template>

<script>
  import _ from 'lodash'
  //import GGridItemSelector from './GGridItemSelector';

  export default {
    name: 'GButtonMerger',
    //components: { GGridItemSelector },
    props: {
      modelValue: null,
      items: {
        type: Array,
        default: () => []
      },
      receivedMergeMap: null,
      receivedMergedButtons: {
        type: Array,
        default: () => []
      },
      cols: {
        type: [String, Number],
        default: '1fr 1fr 1fr 1fr'
      },
      rows: {
        type: [String, Number],
        default: '1fr 1fr'
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.modelValue;
        },
        set(value) {
          this.$emit('update:modelValue', value);
        }
      },
      internalNewItems: {
        get() {
          return this.items;
        }
      }
    },
    data: function () {
      return {
        mergedButtons: [],
        mergeMap: {},
      }
    },
    watch: {
      receivedMergeMap: function () {
        this.mergeMap = this.receivedMergeMap
      },
      receivedMergedButtons: function () {
        this.mergedButtons = this.receivedMergedButtons
      }
    },
    methods: {
      isIncreasingSequence(numArr) {
        for (let num = 0; num < numArr.length - 1; num++) {
          if (!(numArr[num] < numArr[num + 1])) {
            return false;
          }
        }

        return true;
      },
      getGreatestMergeBoundary(mergeArray) {
        let boundary = {
          minValue: -1,
          maxValue: -1
        };
        //Add to array
        let arrayValues = [];
        for (let item of mergeArray) {
          arrayValues = arrayValues.concat(item);
        }
        //reduce to unique and sort increasing
        let distinctValue = [...new Set(arrayValues)].sort((a, b) => a - b);
        if (!this.isIncreasingSequence(distinctValue)) {
          return new Error('Invalid merge!');
        }

        boundary.minValue = distinctValue[0];
        boundary.maxValue = distinctValue[distinctValue.length - 1];

        return boundary;
      },
      calculateArea(row, col) {
        if (!row || !col) {
          return undefined
        }
        return (row[1] - row[0]) * (col[1] - col[0])
      }
      ,
      mergeButtons() {
        if (this.internalValue.length <= 0) {
          return;
        }

        let itemMergeRows = [];
        let itemMergeCols = [];
        let itemMergeRowsRaw = [];
        let itemMergeColsRaw = [];
        let mergedButtons = []
        for (let i of this.internalValue) {
          let itemRow = i.row[0] + '-' + i.row[1];
          itemMergeRows.push(itemRow);
          itemMergeRowsRaw.push(i.row);
          let itemCol = i.col[0] + '-' + i.col[1];
          itemMergeCols.push(itemCol);
          itemMergeColsRaw.push(i.col);
          if (this.internalValue.indexOf(i) !== 0) {
            mergedButtons.push(i.buttonId);
          }
        }

        //validate merge
        let totalArea = _.reduce(this.internalValue, (sum, item) => sum  + this.calculateArea(item.row, item.col), 0);

        let calculatedRow = this.getGreatestMergeBoundary(itemMergeRowsRaw);
        let calculatedCol = this.getGreatestMergeBoundary(itemMergeColsRaw);
        let newButton = {
          row: [calculatedRow.minValue, calculatedRow.maxValue],
          col: [calculatedCol.minValue, calculatedCol.maxValue],
        }

        let newButtonArea = this.calculateArea(newButton.row, newButton.col);

        if(totalArea < newButtonArea) {
          throw new Error('Cant merge')
        }

        //add merged buttons contained in big button
        if (mergedButtons.length > 0) {
          //for split buttons
          //if current mergeMap has the selected button then concat to its children
          if (this.mergeMap.hasOwnProperty(this.internalValue[0].buttonId)) {
            this.mergeMap[this.internalValue[0].buttonId] = this.mergeMap[this.internalValue[0].buttonId].concat(mergedButtons);
            for (let item of mergedButtons) {
              if (this.mergeMap.hasOwnProperty(item)) {
                this.mergeMap[this.internalValue[0].buttonId] = this.mergeMap[this.internalValue[0].buttonId].concat(this.mergeMap[item]);
                delete this.mergeMap[item]
              }
            }
          } else {    //else its a new container button, add it as a new property //then remove merge map key:value that is in mergedButtons
            this.mergeMap = { ...this.mergeMap, ...{ [this.internalValue[0].buttonId]: mergedButtons } };
            //If the button is the children & in mergeMap too, remove it
            for (let item of mergedButtons) {
              if (this.mergeMap.hasOwnProperty(item)) {
                this.mergeMap[this.internalValue[0].buttonId] = this.mergeMap[this.internalValue[0].buttonId].concat(this.mergeMap[item]);
                delete this.mergeMap[item]
              }
            }
          }
          this.internalValue[0] = { ...this.internalValue[0] }
        }
        this.mergedButtons = Object.assign(this.mergedButtons, this.mergedButtons.concat(mergedButtons));
        //set new grid-row
        this.internalValue[0].row[0] = calculatedRow.minValue;
        this.internalValue[0].row[1] = calculatedRow.maxValue;

        //set new grid-col
        this.internalValue[0].col[0] = calculatedCol.minValue;
        this.internalValue[0].col[1] = calculatedCol.maxValue;

        this.$emit('merged', this.mergedButtons, this.mergeMap);
        this.internalValue = [];
      },
      splitButtons() {
        let button = this.internalValue[0];
        let childrenButtons = this.mergeMap[button.buttonId];
        if (!button || !childrenButtons) {
          return
        }
        for (let item of this.items) {
          if (item.buttonId === this.internalValue[0].buttonId) {
            this.internalValue[0].col[0] = item.originalCol[0];
            this.internalValue[0].col[1] = item.originalCol[1];
            this.internalValue[0].row[0] = item.originalRow[0];
            this.internalValue[0].row[1] = item.originalRow[1];
          }
        }

        //Reset styles for contained inside buttons
        for (let child of childrenButtons) {
          //reset its value in newItems by value in item
          //let valueOfChild = child.buttonId;
          let originalItem = this.items.find(x => x.buttonId === child);
          let newItem = this.internalNewItems.find(x => x.buttonId === child);
          if (newItem && originalItem) {
            newItem.col[0] = originalItem.originalCol[0];
            newItem.col[1] = originalItem.originalCol[1];
            newItem.row[0] = originalItem.originalRow[0];
            newItem.row[1] = originalItem.originalRow[1];

            delete this.mergeMap[button.buttonId]
          }
        }

        this.mergedButtons = this.mergedButtons.filter(x => !childrenButtons.includes(x))
        this.$emit('merged', this.mergedButtons, this.mergeMap);
        this.internalValue = [];
      }
    }
  }
</script>

<style scoped>

</style>
