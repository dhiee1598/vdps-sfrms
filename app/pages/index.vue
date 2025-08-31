<script setup lang="ts">
definePageMeta({
  middleware: ['redirect-auth'],
});
const formData = ref({
  email: '',
  password: '',
});

async function handleClick() {
  const { success } = await $fetch('/api/auth/login', { method: 'POST', body: formData.value });

  if (success) {
    await navigateTo('/dashboard');
  }
}
</script>

<template>
  <div class="hero bg-base-200 mx-auto my-10 rounded-lg p-10 flex flex-row justify-center">
    <div class="hero-content flex-col lg:flex-row-reverse gap-24">
      <div class="text-center lg:text-left">
        <h1 class="text-5xl font-bold">
          CASHIER LOGIN
        </h1>
        <p class="py-6">
          Please enter your credentials to access the system.
        </p>
      </div>

      <div class="card bg-base-100 w-full max-w-sm shrink-0 shadow-2xl">
        <div class="card-body">
          <form @submit.prevent="handleClick">
            <fieldset class="fieldset">
              <label class="label">Email</label>
              <input
                v-model="formData.email"
                type="email"
                class="input"
                placeholder="Email"
                required
              >
              <label class="label">Password</label>
              <input
                v-model="formData.password"
                type="password"
                class="input"
                placeholder="Password"
                required
              >
              <div><a class="link link-hover">Forgot password?</a></div>
              <button class="btn btn-neutral mt-4" type="submit">
                Login
              </button>
            </fieldset>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
