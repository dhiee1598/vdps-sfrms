<script setup lang="ts">
const formData = ref({
  email: '',
  password: '',
});

async function handleClick() {
  const { success, role } = await $fetch('/api/auth/login', { method: 'POST', body: formData.value });

  if (success) {
    if (role === 'admin')
      return await navigateTo('/dashboard');

    return await navigateTo('/cashier');
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200 p-6">
    <div class="flex flex-col lg:flex-row items-center justify-center gap-12 w-full max-w-5xl">
      <div class="flex flex-col items-center text-center lg:text-left max-w-md">
        <NuxtImg
          src="/vdps-logo.png"
          alt="Logo"
          height="200"
          width="200"
          class="mb-6"
        />
        <h1 class="text-2xl font-bold">
          Student Financial Record
        </h1>
        <p class="mt-2 text-base-content/70">
          Management System
        </p>
      </div>

      <form @submit.prevent="handleClick">
        <fieldset class="fieldset bg-base-200 border-base-300 rounded-box w-sm border px-4 py-8">
          <legend class="fieldset-legend text-2xl">
            Login
          </legend>

          <label class="label">Email</label>
          <input
            v-model="formData.email"
            type="email"
            class="input input-bordered w-full mb-4"
            placeholder="Enter your email"
            required
          >

          <label class="label">Password</label>
          <input
            v-model="formData.password"
            type="password"
            class="input input-bordered w-full"
            placeholder="Enter your password"
            required
          >

          <button type="submit" class="btn btn-neutral mt-4">
            Login
          </button>
        </fieldset>
      </form>
    </div>
  </div>
</template>
