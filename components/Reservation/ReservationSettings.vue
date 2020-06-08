<template>
  <div class="reservation-settings">
    <div class="reservation-settings__header">Reservation Settings</div>
    <div class="reservation-settings__content">
      <div class="reservation-settings__content__section">
        <g-switch class="mb-3" label="Active reservation" v-model="activeReservation"/>
        <g-switch class="mb-3" label="Incoming reservation notification sound" v-model="soundNotification"/>
        <g-switch class="mb-3" label="Hide empty time slots" v-model="hideEmpty"/>
      </div>
      <div class="reservation-settings__content__section">
        <p>Automatically remove overdue reservations after (min)</p>
        <g-grid-select class="mt-3" :items="removeOverdueAfterList" v-model="removeOverdueAfter" mandatory :grid="false">
          <template #default="{item, toggleSelect}">
            <g-btn-bs style="margin: 0 16px 0 0;" border-color="#E0E0E0" text-color="black" height="30" width="72" @click.stop="toggleSelect(item)">{{item}}</g-btn-bs>
          </template>
          <template #selected="{item}">
            <g-btn-bs style="margin: 0 16px 0 0;" border-color="#90CAF9" background-color="#E3F2FD" text-color="black" height="30" width="72">{{item}}</g-btn-bs>
          </template>
        </g-grid-select>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'ReservationSettings',
    data() {
      return {
        activeReservation: false,
        soundNotification: false,
        hideEmpty: false,
        removeOverdueAfter: 15,
        removeOverdueAfterList: [15, 30, 45, 60]
      }
    }
  }
</script>

<style scoped lang="scss">
  .reservation-settings {
    width: 100%;
    height: 100%;
    padding: 24px 48px;
    overflow: scroll;

    &__header {
      font-size: 18px;
      font-weight: 700;
    }

    &__content {
      font-size: 16px;
      p {
        font-weight: 700;
      }

      &__section {
        margin-top: 24px;

        ::v-deep .g-switch-wrapper {
          label {
            padding-left: 48px;
          }
        }
      }
    }
  }
</style>