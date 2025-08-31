<!-- <script setup lang="ts">
const formData = ref({
  name: '',
  email: '',
  password: '',
});

async function handleClick() {
  console.warn(formData.value);
  const response = await $fetch('/api/private/users', { method: 'POST', body: formData.value });
  console.warn(response, 'response');
}
</script>

<template>
  <div>
    <form @submit.prevent="handleClick">
      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          What is your name?
        </legend>
        <input
          v-model="formData.name"
          type="text"
          class="input"
          placeholder="Type here"
          required
        >
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          Email
        </legend>
        <input
          v-model="formData.email"
          type="email"
          class="input"
          placeholder="Type here"
          required
        >
      </fieldset>

      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          Password
        </legend>
        <input
          v-model="formData.password"
          type="password"
          class="input"
          placeholder="Type here"
          required
        >
      </fieldset>

      <button type="submit" class="btn btn-primary">
        create
      </button>
    </form>
  </div>
</template> -->

<script setup lang="ts">
import { onMounted, ref } from 'vue';

const users = ref<any[]>([]); // make it reactive
const showModal = ref(false); // modal state

const formData = ref({
  name: '',
  email: '',
  password: '',
});

// fetch users
async function loadUsers() {
  users.value = await $fetch('/api/private/users', { method: 'GET' });
}

// call on mount
onMounted(() => {
  loadUsers();
});

async function handleClick() {
  try {
    const response = await $fetch('/api/private/users', {
      method: 'POST',
      body: formData.value,
    });
    console.warn(response, 'response');

    // if successful
    showModal.value = false; // close modal
    await loadUsers(); // refresh list

    // reset form
    formData.value = { name: '', email: '', password: '' };
  }
  catch (err) {
    console.error(err);
  }
}
</script>

<template>
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4">
      <p class="text-3xl">
        List of Users
      </p>
      <button class="btn btn-primary" @click="() => showModal = true">
        Create New User
      </button>
    </div>
    <table class="table">
      <!-- head -->
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
        <!-- row 1 -->

        <tr v-for="user in users" :key="user.id">
          <th>{{ user.id }}</th>
          <td>{{ user.name }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.createdAt ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(user.createdAt)) : '' }}</td>
          <td>
            <button class="btn btn-primary">
              View
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <dialog :open="showModal" class="modal">
      <div class="modal-box ">
        <h3 class="text-lg font-bold">
          Hello!
        </h3>
        <p class="py-4">
          Press ESC key or click the button below to close
        </p>
        <div class="modal-action">
          <form class="flex flex-col gap-4 w-full" @submit.prevent="handleClick">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                User's Full Name?
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
              <button type="submit" class="btn btn-primary">
                create
              </button>
              <button
                type="button"
                class="btn btn-warning"
                @click="showModal = false"
              >
                close
              </button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  </div>
</template>
