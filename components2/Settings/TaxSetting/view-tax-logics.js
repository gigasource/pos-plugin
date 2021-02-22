import { useI18n } from 'vue-i18n';
import { computed, ref } from 'vue';
import cms from 'cms';
import { internalValueFactory } from '../../utils';


import Hooks from 'schemahandler/hooks/hooks'


export const listTaxCategories = ref([])
export const selectedTaxCategory = ref(null)

export const taxCategoryHooks = new Hooks()

taxCategoryHooks.on('updateListTaxCategories', async() => {
  listTaxCategories.value = await getListTaxCategory()
})

export function onSelectTax(tax) {
  selectedTaxCategory.value = tax;
}

export async function getListTaxCategory() {
  return await cms.getModel('TaxCategory').find();
}

export function init() {
  getListTaxCategory().then(v => listTaxCategories.value = v)
}

export const dineInTaxCategories = computed(() => {
  return listTaxCategories.value.filter(i => i.type.includes('dineIn'))
})

export const takeAwayTaxCategories = computed(() => {
  return listTaxCategories.value.filter(i => i.type.includes('takeAway'))
})

export const dialogRef = ref(null)
export const showDialogConfirmDelete = ref(false)

export function onOpenTaxCategoryDialog() {
  dialogRef.value && dialogRef.value.open(false);
}

export function onOpenDialogEditTaxCategory() {
  dialogRef.value && dialogRef.value.open(true);
}

export function onOpenDialogDelete() {
  showDialogConfirmDelete.value = true;
}

export async function onDeleteTaxCategory() {
  await updateTaxCategory(selectedTaxCategory.value._id);
  selectedTaxCategory.value = null
}

export async function updateTaxCategory(oldTaxId, newTaxCategory) {
  const TaxCategoryModel = cms.getModel('TaxCategory');
  if (oldTaxId && !newTaxCategory) { // delete
    await TaxCategoryModel.deleteOne({ _id: oldTaxId })
  } else if (newTaxCategory && !oldTaxId) { // insert
    await TaxCategoryModel.create(newTaxCategory)
  } else { // update
    await TaxCategoryModel.findOneAndUpdate({ _id: oldTaxId }, newTaxCategory)
  }
  listTaxCategories.value = await getListTaxCategory()
}

export const TaxCategoryDialogLogicsFactory = (props, { emit }) => {
  const taxValue = ref('')
  const taxName = ref('')
  const taxType = ref('')
  const internalValue = internalValueFactory(props, { emit })
  const isEditing = ref(false)
  const rules = ref({
    number: val => !isNaN(val) || 'Must be a number',
    range: val => isNaN(val) || (val <= 100 && val >= 0) || 'Tax Range: 0 - 100'
  })
  const isValid = computed(() => {
    return !(!taxValue.value || !taxName.value || typeof rules.value.number(taxValue.value) === 'string'
      || typeof rules.value.range(taxValue.value) === 'string');
  })

  async function submit() {
    let taxCategory = {
      value: parseInt(taxValue.value),
      name: taxName.value,
      type: taxType.value
    }
    if (isEditing.value) {
      Object.assign(selectedTaxCategory.value, taxCategory)
      taxCategory = selectedTaxCategory.value
    }
    await updateTaxCategory(taxCategory._id, taxCategory);
    [taxValue.value, taxName.value, taxType.value] = ['', '', ''];
    internalValue.value = false;
  }

  function open(_isEditing) {
    isEditing.value = _isEditing
    if (isEditing.value && selectedTaxCategory.value) {
      ({value: taxValue.value, name: taxName.value, type: taxType.value} = selectedTaxCategory.value)
      taxValue.value = taxValue.value.toString()
    } else {
      [taxValue.value, taxName.value, taxType.value] = ['', '', ''];
    }
    internalValue.value = true;
  }
  return {
    taxValue,
    taxName,
    taxType,
    open,
    submit,
    isValid,
    internalValue,
    isEditing,
    rules
  }
}
