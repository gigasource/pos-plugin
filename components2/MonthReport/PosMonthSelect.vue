<script>
export default {
  setup() {
    return () => <>
      <div class="month-select-wrapper" >
        <g-icon class="mr-4" onClick={previousMonth} >
          arrow_back_ios
        </g-icon>
        <span>
          {month} </span>
        <g-icon class="ml-4" onClick={nextMonth} >
          arrow_forward_ios
        </g-icon>
      </div>
    </>
  }
}
</script>
<style scoped lang="scss">
  .month-select-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 700;
    font-size: 18px;
    color: #212B35;
    background: #F0F0F0;
    box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.14);
  }
</style>
