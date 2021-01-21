<script>
export default {
  setup() {
    return () => <></>
  }
}
</script>

<style scoped lang="scss">
  .header {
    border-bottom: 1px solid #979797;
    padding: 16px;
  }

  .content {
    flex: 1;
    overflow: scroll;

    &--main {
      flex-grow: 1;
      padding: 16px;
      overflow: scroll;
    }

    &--sidebar {
      border-left: 0.5px solid #979797;
      width: 25%;
      overflow: scroll;
      position: relative;
    }
  }

  .g-btn {
    margin-right: 16px;
    border: 1px solid #D0D0D0;
    border-radius: 2px;
    font-weight: bold;
  }

  .active-btn {
    background: #E3F2FD !important;
    border: 1px solid #90CAF9 !important;
  }

  .edit-btn {
    border: 2px solid #1271FF !important;
  }

  .prop-option {
    display: inline-block;
    padding: 0 6px;
    margin-right: 4px;
    cursor: pointer;
    border: 1px solid #E0E0E0;
    box-sizing: border-box;
    border-radius: 2px;
    font-size: 13px;

    &--active {
      background: #E3F2FD;
      border: 1px solid #90CAF9;
    }
  }
</style>
