<script>
  import categoryEditorFactory from './CategoryEditorFactory'
  const { hooks, fn } = categoryEditorFactory()
  export default fn()
</script>
<style scoped lang="scss">
  .category-editor {
    padding-left: 20px;
    padding-right: 20px;
    height: 100%;
    overflow: auto;
    
    &__label {
      color: #000;
      margin-top: 16px;
      margin-bottom: 13px;
      font-weight: 700;
      font-size: 15px;
    }
    
    .bs-tf-wrapper {
      margin: 0;
      
      ::v-deep .bs-tf-input {
        color: #000;
      }
    }
  }
  
  .g-snack ::v-deep .g-snack-wrapper {
    min-width: auto;
  }
  
  @media screen and (max-width: 1023px) {
    .category-editor {
      padding-left: 8px;
      padding-right: 8px;
      
      &__label {
        font-size: 13px;
        margin-top: 8px;
        margin-bottom: 4px;
      }
    }
  }
</style>
