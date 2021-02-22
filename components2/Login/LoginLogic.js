import { computed, ref } from 'vue';
import { user } from '../AppSharedStates';

export const passcode = ref('')
export const isValidPasscode = computed(() => !!passcode.value)

export async function login(passcode) {
  const loginUser = await cms.getModel('PosUser').findOne({ passcode })
  user.value = loginUser
  return !!loginUser
}

export const incorrectPasscode = ref(null)

