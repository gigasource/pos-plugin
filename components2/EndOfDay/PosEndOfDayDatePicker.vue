<script>
import {PosEndOfDayDatePicker} from "./PosEndOfDayDatePickerUi";

export default PosEndOfDayDatePicker;
</script>

<style lang="scss" scoped>
/*@import "../../style/variables";*/
/*@import "../../style/colors";*/
.g-picker {
  background-color: #eee;
}

button {
  outline: none;
}

:deep(table) {
  border-collapse: collapse;
}

$textDisabled: #9e9e9e;
$primary-transition: 0.5s cubic-bezier(0.25, 0.8, 0.5, 1) !default;

/*TITLE*/
.g-date-picker-title {
  display: flex;
  flex-direction: column;
  line-height: 1;

  &__year {
    display: inline-flex;
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 8px;
    cursor: pointer;
  }

  &__date {
    font-size: 24px;
    text-align: left;
    font-weight: 500;
    position: relative;
    overflow: hidden;
    padding-bottom: 8px;
    margin-bottom: -8px;
  }

  &--disabled {
    color: $textDisabled;
  }
}

/*YEAR PICKER*/
.g-date-picker-years {
  font-size: 16px;
  font-weight: 400;
  height: 50vh;
  list-style-type: none;
  overflow: auto;
  text-align: center;
  padding: 0;
  margin-top: 0;
  margin-bottom: 0;

  li {
    cursor: pointer;
    padding: 8px 0;
    transition: none;
    width: 100%;
    display: inline-block;

    &.active {
      font-size: 26px;
      font-weight: 500;
      padding: 10px 0;
    }

    &:hover {
      background: rgba(0, 0, 0, 0.12);
    }
  }
}

/*HEADER*/
:deep(.g-date-picker-header) {
  padding: 8px 0 8px 0;
  margin-left: 12px;
  margin-right: 12px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  background-color: transparent;

  .g-date-picker-header-container {
    width: 27%;
    margin-right: auto;
    margin-left: auto;
    display: flex;

    .g-date-picker-header__value {
      flex: 1;
      position: relative;

      div {
        transition: $primary-transition;
        width: 100%;
        display: flex;
        justify-content: center;
      }

      button {
        font-size: 18px;
        font-style: normal;
        cursor: pointer;
        font-weight: bold;
        outline: none;
        padding: 0.5rem;
        transition: $primary-transition;
        background-color: transparent;
        border-style: none;
        color: #212B35;
      }

      .g-date-picker-header--disabled {
        button {
          color: $textDisabled;
        }
      }
    }

    %navigate_button {
      width: 24px;
      padding: 0;
      border: none;
      font-size: 25px;
      background-color: transparent;
    }

    .g-date-picker-header__prev-button {
      @extend %navigate_button;

      &::after {
        content: '\F141';
        font-family: "Material Design Icons";
      }
    }

    .g-date-picker-header__next-button {
      @extend %navigate_button;

      &::after {
        content: '\F142';
        font-family: "Material Design Icons";
      }
    }
  }
}

/*TABLE*/
:deep(.g-date-picker-table) {
  position: relative;
  padding: 0 16px;
  height: 100%;
  background-color: #eeeeee;

  table {
    transition: $primary-transition;
    table-layout: fixed;
    width: 100%;

    thead {
      tr:first-child {
        border-left: 1px solid #E0E0E0;
      }

      tr:last-child {
        border-right: 1px solid #E0E0E0;
      }
    }
  }

  tr {
    height: 32px;
  }

  td, th {
    text-align: center;
    position: relative;
  }

  th {
    background-color: #FFFFFF;
    font-size: 13px;
    font-weight: normal;
    line-height: 17px;
    color: #6e6e6e;
    border-top: 1px solid #E0E0E0;
  }

  td {
    height: 13.4vh;
    border: 1px solid #E0E0E0;
    position: relative;
    color: #9E9E9E;

    button .g-table-item__content {
      font-family: Muli;
      font-size: 20px;
      font-weight: bold;
    }
  }

  button {
    background-color: transparent;
    border-style: none;
    color: inherit;
    box-shadow: none;
  }

  .g-date-picker-table--date .g-table-item {
    height: 32px;
    width: auto;
  }

  .g-table-item {
    margin: 0;
    z-index: auto;
    font-size: 12px;
    background-color: #ffffff;
    border-style: none;
    color: inherit;
    width: 100%;
    height: 100%;

    &--active {
      color: #9E9E9E;
      border: 2px solid #1271FF !important;
    }

    &--start-range, &--end-range {
      color: #fff;
      text-shadow: 0 4px 4px rgba(0, 0, 0, 0.25);
    }

    &--in-range {
      color: #232323;
    }

    &--outlined {
      border: thin solid #232323;
    }

    &--readonly {
      pointer-events: none;
    }

    &--disabled {
      color: #E0E0E0;
      border-color: $textDisabled;
    }

    &__background {
      width: 0;
      top: 2px;
      height: 32px;
      position: absolute;
      z-index: -1;

      &--start-range {
        width: 50%;
        right: 0;
      }

      &--in-range {
        width: 100%;
        right: 0;
      }

      &--end-range {
        width: 50%;
        left: 0;
      }
    }
  }
}

.g-date-picker-table--date {
  th {
    padding: 8px 0;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.38);
  }

  td {
    width: 32px;
    padding: 0;
  }

  & .g-date-picker-table__events {
    bottom: 6px;
    height: 8px;
    left: 0;
    position: absolute;
    text-align: center;
    white-space: pre;
    width: 100%;

    > div {
      border-radius: 50%;
      display: inline-block;
      height: 8px;
      margin: 0 1px;
      width: 8px;
    }
  }
}

.g-date-picker-table--month {
  td {
    width: 33.333333%;
    height: 15vh;

    .g-table-item {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
