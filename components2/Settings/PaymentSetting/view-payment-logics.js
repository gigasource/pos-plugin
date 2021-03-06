import { computed, ref } from 'vue';
import { posSettings } from '../../AppSharedStates';
import { updatePayment } from '../settings-be';
import { useI18n } from 'vue-i18n';
import { internalValueFactory } from '../../utils';
import { ObjectID } from 'bson';

export const listPayments = computed(() => {
  return posSettings.value.payment || []
})

export const selectedPayment = ref(null)

export function onSelectPayment(payment) {
  selectedPayment.value = payment
}

export const dialogRef = ref(null)
export const showDialogConfirmDelete = ref(false)

export function onOpenDialogNewPayment() {
  dialogRef.value && dialogRef.value.openPaymentDialog(false)
}

export function onOpenDialogEditPayment() {
  dialogRef.value && dialogRef.value.openPaymentDialog(true)
}

export function onOpenDialogDelete() {
  showDialogConfirmDelete.value = true;
}

export async function onDeletePayment() {
  await updatePayment(selectedPayment.value);
  selectedPayment.value = null;
}


//dialog logics

export const PaymentDialogLogicsFactory = (props, { emit }) => {
  const internalValue = internalValueFactory(props, { emit })
  const paymentName = ref('')
  const iconSrc = ref(null)
  const isEditing = ref(false)
  const showKeyboard = ref(false)

  function openPaymentDialog(_isEditing) {
    isEditing.value = _isEditing;
    if (isEditing.value && selectedPayment.value) {
      paymentName.value = selectedPayment.value.name;
      iconSrc.value = selectedPayment.value.icon;
    } else {
      paymentName.value = '';
      iconSrc.value = '';
    }
    internalValue.value = true;
  }

  function resetData() {
    paymentName.value = '';
    iconSrc.value = '';
    selectedPayment.value = null;
    isEditing.value = false;
  }

  function back() {
    resetData();
    internalValue.value = false;
  }

  async function save() {
    if (paymentName.value) {
      let payment = {
        name: paymentName.value.toLowerCase(),
        icon: iconSrc.value,
      }

      let oldPayment;
      if (isEditing.value) {
        oldPayment = selectedPayment.value;
        payment = Object.assign(selectedPayment.value, payment)
      } else {
        payment._id = new ObjectID()
        //todo: should be able to modify editable in UI
        payment.editable = true
      }
      await updatePayment(oldPayment, payment);
    }
    back();
  }
  return {
    internalValue,
    paymentName,
    iconSrc,
    showKeyboard,
    save,
    back,
    openPaymentDialog,
    isEditing
  }
}
