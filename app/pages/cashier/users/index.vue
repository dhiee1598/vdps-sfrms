<script setup lang="ts">
import { ref, watchEffect } from 'vue';

const session = useUserSession();

const { data: user, pending } = useFetch(`/api/private/users/${session.user.value?.id}`);

const formData = ref({
  name: '',
  email: '',
  password: '',
});

// Fill form when user data arrives
watchEffect(() => {
  if (user.value?.data) {
    formData.value = {
      name: user.value.data.name ?? '',
      email: user.value.data.email ?? '',
      password: '',
    };
  }
});

async function updateUser() {

}
</script>

<template>
  <div class="max-w-md mx-auto p-6 bg-base-100 rounded-lg shadow-lg">
    <h2 class="text-2xl font-bold mb-4">
      Update Profile
    </h2>

    <div v-if="pending" class="text-center">
      Loading...
    </div>

    <form
      v-else
      class="flex flex-col gap-4"
      @submit.prevent="updateUser"
    >
      <label class="form-control">
        <span class="label-text">Name</span>
        <input
          v-model="formData.name"
          type="text"
          class="input input-bordered w-full"
          required
        >
      </label>

      <label class="form-control">
        <span class="label-text">Email</span>
        <input
          v-model="formData.email"
          type="email"
          class="input input-bordered w-full"
          required
        >
      </label>

      <label class="form-control">
        <span class="label-text">Password</span>
        <input
          v-model="formData.password"
          type="password"
          class="input input-bordered w-full"
          placeholder="Leave blank to keep current password"
        >
      </label>

      <button type="submit" class="btn btn-primary w-full">
        Save Changes
      </button>
    </form>
  </div>
</template>
