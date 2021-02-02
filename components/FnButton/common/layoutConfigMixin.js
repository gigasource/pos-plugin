 export default {
    data: () => ({
      buttonColors: [
        {
          text: '#FFFFFF',
          value: '#FFFFFF'
        },
        {
          text: '#FFA726',
          value: '#FFA726'
        },
        {
          text: '#FF87E9',
          value: '#FF87E9'
        },
        {
          text: '#73F8F8',
          value: '#73F8F8'
        },
        {
          text: '#66BB6A',
          value: '#66BB6A'
        },
        {
          text: '#1976D2',
          value: '#1976D2'
        },
        {
          text: '#7575FF',
          value: '#7575FF'
        },
        {
          text: '#F6787C',
          value: '#F6787C'
        },
      ],
      activeClass: 'color-select-active',
      activeSelectedButton: 'active-selected',
      selectedButtons: [],
      selectedFunction: null,
      selectedColor: null,
      mergeMode: false,
      splitMode: false,
      posSettings: null,
      mergedButtons: [],
      mergeMap: null,
      textFieldFunctionValue: '',
      textFieldValue: '',
      showMenu: false,
    }),
    computed: {
      isButtonSelected() {
        return this.selectedButtons.length > 0;
      },
      isInConfigLayoutMode() {
        return this.mergeMode || this.splitMode;
      },
    },
    methods: {
      updateButtonFunction(value) {
        this.updateButton(value, 'buttonFunction');
        this.updateButtonItems();
      },
      computeSelectedColorStyle(item) {
        return {
          boxShadow: 'none',
          borderRadius: '50%',
          width: '38px',
          minWidth: '38px',
          height: '38px',
          border: '2px solid #1271FF',
          backgroundColor: item.value
        }
      },
      computeColorStyle(item) {
        return {
          marginRight: '14px',
          boxShadow: 'none',
          borderRadius: '50%',
          width: '38px',
          minWidth: '38px',
          height: '38px',
          border: '1px solid #D2D2D2',
          backgroundColor: item.value
        }
      },
      computeButtonStyle(item) {
        return {
          display: this.mergedButtons.indexOf(item.buttonId) >= 0 ? 'none' : '',
          gridRow: item.row[0] + '/' + item.row[1],
          gridColumn: item.col[0] + '/' + item.col[1],
          backgroundColor: item.style.backgroundColor,
          color: item.style.backgroundColor && item.style.backgroundColor !== '#FFFFFF' ? item.style.textColor : '',
          border: '1px solid #979797'
        }
      },
      computeSelectedButtonStyle(item) {
        return {
          display: this.mergedButtons.indexOf(item.buttonId) >= 0 ? 'none' : '',
          gridRow: item.row[0] + '/' + item.row[1],
          gridColumn: item.col[0] + '/' + item.col[1],
          backgroundColor: item.style.backgroundColor,
          color: item.style.backgroundColor && item.style.backgroundColor !== '#FFFFFF' ? item.style.textColor : '',
        }
      },
      toggleMode(mode) {
        switch (mode) {
          case 'merge':
            this.mergeMode = !this.mergeMode;
            this.selectedButtons = []
            this.splitMode = false;
            this.showMenu = false;
            break;
          case 'split':
            this.splitMode = !this.splitMode;
            this.selectedButtons = []
            this.mergeMode = false;
            this.showMenu = false;
            break;
          case 'cancel':
            this.splitMode = false;
            this.selectedButtons = []
            this.mergeMode = false;
            this.showMenu = false;
            break;
          default:
            throw new Error('Invalid mode')
        }
      },
      mapFetchedButtons(buttonList, dataList) {
        for (let item of buttonList) {
          const {
            backgroundColor, buttonFunction, buttonFunctionValue, originalRows, originalCols,
            text, textColor, containedButtons, _id, rows, cols, buyback
          } = item;

          dataList.push({
            row: rows,
            col: cols,
            originalRow: originalRows,
            originalCol: originalCols,
            text,
            style: { backgroundColor: backgroundColor, textColor: textColor },
            buttonFunction,
            buttonFunctionValue,
            buttonId: _id,
            buyback
          })

          this.mergedButtons = this.mergedButtons.concat(containedButtons);
          if (containedButtons.length > 0) {
            if (this.mergeMap) {
              this.mergeMap = Object.assign(this.mergeMap, { [_id]: containedButtons });
            } else {
              this.mergeMap = Object.assign({}, { [_id]: containedButtons });
            }
          }
        }
      },
      updateButton(newVal, updatedField) {
        if (this.selectedButtons[0]) {
          this.selectedButtons[0][updatedField] = newVal;

          const item = this.findSelectedButton(this.selectedButtons[0]);
          if (item) {
            item[updatedField] = newVal;
          }
        }
      }
    }
  }
