<script setup lang="ts">
import { ref } from 'vue';

// useFetch automatically loads users
const { data: users, pending, error, refresh } = await useFetch('/api/private/users');

const showModal = ref(false);

const formData = ref({
  name: '',
  email: '',
  password: '',
});

async function handleClick() {
  try {
    await $fetch('/api/private/users', {
      method: 'POST',
      body: formData.value,
    });

    // if successful → close modal + reset form
    showModal.value = false;
    formData.value = { name: '', email: '', password: '' };

    // reload Nuxt data
    await refresh();
  }
  catch (err) {
    console.error(err);
  }
}
</script>

<template>
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4">
      <p class="text-2xl">
        List of Users
      </p>
      <button class="btn btn-accent" @click="showModal = true">
        <Icon name="solar:add-circle-linear" size="24" /> New User
      </button>
    </div>

    <!-- Loading & error states -->
    <div v-if="pending">
      Loading...
    </div>
    <div v-else-if="error">
      Error loading users
    </div>

    <!-- Table -->
    <table v-else class="table">
      <thead>
        <tr>
          <th />
          <th>Name</th>
          <th>Email</th>
          <th>Created At</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in users" :key="user.id">
          <th class="w-1/8">
            {{ user.id }}
          </th>
          <td class="w-1/3">
            {{ user.name }}
          </td>
          <td class="w-1/3">
            {{ user.email }}
          </td>
          <td class="w-full">
            {{
              user.createdAt
                ? new Intl.DateTimeFormat('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                }).format(new Date(user.createdAt))
                : ''
            }}
          </td>
          <td>
            <button class="btn btn-success tooltip tooltip-success" data-tip="view">
              <Icon name="solar:eye-linear" size="16" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal -->
    <dialog :open="showModal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          Create User
        </h3>

        <div class="modal-action">
          <form class="flex flex-col gap-4 w-full" @submit.prevent="handleClick">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                User's Full Name
              </legend>
              <input
                v-model="formData.name"
                type="text"
                class="input w-full"
                placeholder="Type here"
                required
              >
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                User's Email
              </legend>
              <input
                v-model="formData.email"
                type="email"
                class="input w-full"
                placeholder="Type here"
                required
              >
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                User's Password
              </legend>
              <input
                v-model="formData.password"
                type="password"
                class="input w-full"
                placeholder="Type here"
                required
              >
            </fieldset>

            <div class="flex flex-row justify-end gap-2">
              <button type="submit" class="btn btn-accent">
                Create
              </button>
              <button
                type="button"
                class="btn"
                @click="showModal = false"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  </div>
</template>
