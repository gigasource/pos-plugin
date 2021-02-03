import { computed, ref } from 'vue';
import { currentUserIsAdmin, isAdmin, isLoggedIn, user } from '../../../AppSharedStates';
import { attrComputed, isSameId } from '../../../utils';
import { login } from '../../../Login/LoginLogic';
export const showDialogUserDetail = ref(false)
export const focusInput = ref('username')
export const showDialogSelectAvatar = ref(false)
export const showDialogNewUser = ref(false)
export const selectedUser = ref(null)
export const viewOnlineOrderDashboard = attrComputed(selectedUser, 'viewOnlineOrderDashboard', false)
export const viewOrder = attrComputed(selectedUser, 'viewOrder', false)
export const viewOnlineOrderMenu = attrComputed(selectedUser, 'viewOnlineOrderMenu', false)
export const viewOrderHistory = attrComputed(selectedUser, 'viewOrderHistory', false)
export const viewReservation = attrComputed(selectedUser, 'viewReservation', false)

export const userList = ref([])
export const selectedUserIsAdmin = computed(() => {
  return isLoggedIn.value && selectedUser.value.role === 'admin'
})

export async function init() {
  userList.value = await getUserList()
}

export const filteredUserList = computed(() => {
  if (!isLoggedIn.value) {
    return [];
  }
  let res
  if (!currentUserIsAdmin.value) {
    res = _.map(_.filter(userList.value, user => !isAdmin(user)), (u) => ({
      ...u,
      prepend: u.avatar
    }))
  } else {
    res = userList.value.map(u => ({
      ...u,
      prepend: u.avatar
    }));
  }
  return res
})

export function onEditUsername() {
  focusInput.value = 'username';
  showDialogUserDetail.value = true;
}

export function onEditPasscode() {
  focusInput.value = 'passcode';
  showDialogUserDetail.value = true;
}

export function onAddUser() {
  showDialogNewUser.value = true;
}

export async function onSave() {
  await updateUser(selectedUser.value._id, selectedUser.value);
}

async function getUserList() {
    return await cms.getModel('PosUser').find().lean();
}

export const showDialogConfirmDelete = ref(false)

export const isCurrentUser = computed(() => {
  if (!isLoggedIn.value || !selectedUser.value) return false;
  return isSameId(user.value, selectedUser.value)
})

export async function updateUser(oldUserId, newUser) {
  const UserModel = cms.getModel('PosUser');
  if (oldUserId && !newUser) {
    await UserModel.deleteOne({ _id: oldUserId })
  } else if (newUser && !oldUserId) {
    const defaultAvatar = await cms.getModel('Avatar').findOne({ name: 'man-1' })
    newUser.avatar = defaultAvatar.image
    await UserModel.create(newUser)
  } else {
    await UserModel.findOneAndUpdate({ '_id': oldUserId }, newUser)
  }
  userList.value = await getUserList();
  //update currentUser logged in if change
  if (oldUserId && user.value._id.toString() === oldUserId.toString()) {
    user.value = userList.value.find(u => u._id.toString() === oldUserId.toString());
  }
}

export function onOpenDialogDelete() {
  showDialogConfirmDelete.value = true;
}

export async function onDeleteUser() {
  if (selectedUser.value._id) {
    await updateUser(selectedUser.value._id)
    //fixme: auto select first user
    // selectedUser.value = {
    //   ...listUsers[0],
    //   prepend: listUsers[0].avatar,
    // }
  }
}
