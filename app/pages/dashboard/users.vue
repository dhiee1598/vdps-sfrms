<script setup lang="ts">
import type { FetchError } from 'ofetch';

const session = useUserSession();

const { data: users, pending, refresh } = useFetch(`/api/private/users/${session.user.value?.id}`, { lazy: true });
const { isMessage, isError, responseMessage, showMessage } = useNotification();

const isEditing = ref(false);
const isSubmitting = ref(false);
const previewImage = ref<string | null>(null);

const formData = ref({
  name: '',
  email: '',
  profile_image: '/default-profile.png',
  old_password: '',
  new_password: '',
});

const avatars = [
  '/avatar-1.png',
  '/avatar-2.png',
  '/avatar-3.png',
  '/avatar-4.png',
  '/avatar-5.png',
  '/avatar-6.png',
  '/avatar-7.png',
  '/avatar-8.png',
  '/avatar-9.png',
  '/avatar-10.png',
];

function openEdit() {
  previewImage.value = null;
  isEditing.value = true;
  if (users.value) {
    formData.value.name = users.value.data.name;
    formData.value.email = users.value.data.email;
    formData.value.profile_image = users.value.data.profile_image || '/default-profile.png';
    formData.value.old_password = '';
    formData.value.new_password = '';
  }
}

function selectAvatar(avatar: string) {
  formData.value.profile_image = avatar;
  previewImage.value = null;
}

async function saveChanges() {
  isSubmitting.value = true;
  try {
    const response = await $fetch(`/api/private/users/${session.user.value?.id}`, {
      method: 'PUT',
      body: formData.value,
    });

    isEditing.value = false;
    showMessage(response.message, false);
    await refresh();
  }
  catch (e) {
    const error = e as FetchError;
    showMessage(error.data.message || 'An unexpected error occurred.', true);
  }
  finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="w-full p-10">
    <div v-if="pending" class="flex items-center justify-center">
      <span class="loading loading-ring loading-xl" />
    </div>
    <div v-else>
      <div class="shadow-lg p-8 max-w-3xl flex flex-col sm:flex-row gap-6">
        <div class="avatar">
          <div class="ring-accent ring-offset-base-100 w-52 rounded-full ring-2 ring-offset-2">
            <NuxtImg :src="users?.data.profile_image || '/default-profile.png'" />
          </div>
        </div>

        <div class="flex flex-col justify-center flex-1">
          <h2 class="text-2xl font-semibold">
            {{ users?.data.name }}
          </h2>
          <p class="label">
            {{ users?.data.email }}
          </p>
          <span class="mt-2 label text-blue-500">{{ users?.data.role }}</span>
        </div>

        <div class="top-6 right-6">
          <button class="btn btn-accent" @click="openEdit">
            Edit Profile
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <dialog :open="isEditing" class="modal">
      <div class="modal-box">
        <div class="px-6 py-2 w-full max-w-lg">
          <h2 class="text-xl font-bold">
            Edit Profile
          </h2>

          <form @submit.prevent="saveChanges">
            <div class="space-y-4">
              <div class="flex flex-col items-center gap-3">
                <NuxtImg
                  :src="previewImage || formData.profile_image"
                  class="w-34 rounded-full object-cover border-4"
                />
                <p class="text-sm text-gray-500">
                  Choose an avatar
                </p>
                <div class="grid grid-cols-5 gap-3 mt-2">
                  <NuxtImg
                    v-for="(avatar, index) in avatars"
                    :key="index"
                    :src="avatar"
                    class="rounded-full cursor-pointer border-2 hover:border-blue-500"
                    :class="{ 'border-blue-600': formData.profile_image === avatar }"
                    height="56"
                    width="56"
                    @click="selectAvatar(avatar)"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm label">Name</label>
                <input
                  v-model="formData.name"
                  type="text"
                  class="w-full px-3 py-2 input"
                  required
                >
              </div>
              <div>
                <label class="label">Email</label>
                <input
                  v-model="formData.email"
                  type="email"
                  class="w-full px-3 py-2 input"
                  required
                >
              </div>
              <div>
                <label class="label">Old Password</label>
                <input
                  v-model="formData.old_password"
                  type="password"
                  class="w-full px-3 py-2 input"
                >
              </div>
              <div>
                <label class="label">New Password</label>
                <input
                  v-model="formData.new_password"
                  type="password"
                  class="w-full px-3 py-2 input"
                >
              </div>
            </div>

            <div class="flex justify-end gap-3 mt-6">
              <button
                class="btn"
                type="button"
                :disabled="isSubmitting"
                @click.prevent="isEditing = false"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="btn btn-accent"
                :disabled="isSubmitting"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </dialog>

    <ToastNotification
      :is-message="isMessage"
      :is-error="isError"
      :response-message="responseMessage"
    />
  </div>
</template>
