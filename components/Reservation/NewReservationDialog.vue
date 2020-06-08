<template>
  <g-dialog v-model="value">
    <g-card>
      <g-card-text class="row-flex">
        <div class="reservation--dial col-5">

        </div>
        <div class="reservation--form col-7">
          <div class="reservation--form__header">Make Reservation</div>
          <div class="reservation--form__content">
            <div class="row-flex">
              <g-text-field-bs label="Name" required/>
              <g-text-field-bs label="Phone" required/>
            </div>
            <g-textarea label="Note"/>
          </div>
        </div>
      </g-card-text>
    </g-card>
  </g-dialog>
</template>

<script>
  export default {
    name: 'NewReservationDialog',
    props: {
      value: Boolean
    },
    data() {
      return {}
    }
  }
</script>

<style scoped>

</style>