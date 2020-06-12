<template>
  <div>
    <g-dialog v-model="internalValue" width="40%" eager>
      <div class="dialog">
        <div class="dialog-title">Add New Category</div>
        <g-text-field-bs large label="Category Name:" v-model="category" @input="errorMessage = null" >
          <template v-slot:append-inner>
            <g-icon @click.stop="openDialog" size="16" class="mb-1">icon-keyboard</g-icon>
          </template>
        </g-text-field-bs>
        <div style="font-style: italic; font-size: 15px; color: #FF5252;">{{errorMessage}}</div>
        <div class="dialog-buttons">
          <g-btn-bs width="100" large text-color="#424242" @click="close()">Cancel</g-btn-bs>
          <g-btn-bs width="100" large text-color="white" background-color="indigo-accent-2" @click="submit">OK</g-btn-bs>
        </div>
      </div>
      <dialog-text-filter label="Category" v-model="dialog" :default-value="category" @submit="category = $event"/>
    </g-dialog>
  </div>
</template>

<script>
  export default {
    name: "dialogNewCategory",
    props: {
      value: null,
    },
    data() {
      return {
        category: '',
        errorMessage: null,
        dialog: false
      }
    },
    computed: {
      internalValue: {
        get() {
          return this.value
        },
        set(val) {
          this.category = ''
          this.$emit('input', val)
        }
      }
    },
    methods: {
      close() {
        this.internalValue = false
      },
      submit() {
        this.$emit('submit', this.category, (response) => {
          if (response.ok)
            this.close()
          else
            this.errorMessage = response.message
        })
      },
      openDialog() {
        if(!this.$route.query.device) return
        this.dialog = true
      }
    }
  }
</script>

<style scoped lang="scss">
  .dialog {
    background: white;
    border-radius: 4px;
    width: 100%;
    padding: 40px;
    display: flex;
    flex-direction: column;

    &-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 28px;
    }

    &-buttons {
      display: flex;
      align-self: flex-end;
      margin-top: 24px;
    }
  }
</style>
