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
const users = await $fetch('/api/private/users', { method: 'GET' });
console.warn (users, 'users');
</script>

<template>
  <div class="w-full p-10">
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
  </div>
</template>
