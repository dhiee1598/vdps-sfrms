<script setup lang="ts">
import type { FetchError } from 'ofetch';

useHead({
  title: 'Login',
});

const { isMessage, isError, responseMessage, showMessage } = useNotification();

const isLoading = ref(false);
const isPasswordShown = ref(false);

const formData = ref({
  email: '',
  password: '',
});

async function handleClick() {
  try {
    const response = await $fetch('/api/auth/login', { method: 'POST', body: formData.value });

    if (response.role === 'admin')
      return await navigateTo('/dashboard');

    return await navigateTo('/cashier');
  }
  catch (e) {
    const error = e as FetchError;
    responseMessage.value = error.data.message || 'Unknown error occur';
    formData.value.email = '';
    formData.value.password = '';
    isError.value = true;
    showMessage(responseMessage.value, true);
  }
  isLoading.value = false;
}

function togglePasswordVisibility() {
  isPasswordShown.value = !isPasswordShown.value;
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <div class="flex flex-col glass lg:flex-row items-center justify-center gap-12 w-full max-w-5xl shadow-md px-4 py-10 rounded-lg">
      <div class="flex flex-col items-center text-center lg:text-left max-w-md">
        <img
          src="/vdps-logo.png"
          alt="Logo"
          height="200"
          width="200"
          class="mb-6"
        >
        <h1 class="text-2xl font-bold">
          Student Financial Record
        </h1>
        <p class="mt-2 text-base-content/70">
          Management System
        </p>
      </div>

      <form @submit.prevent="handleClick">
        <fieldset class="fieldset rounded-box w-sm border border-accent px-4 py-8 back">
          <legend class="fieldset-legend text-2xl font-light text-accent">
            Login
          </legend>

          <label class="input input-accent mb-6 w-full" :class="{ 'input-error': isError }">
            <Icon
              name="tabler:user-filled"
              size="18"
              class="text-accent-content"
            />
            <input
              v-model="formData.email"
              type="email"
              required
              placeholder="Email"
              @input="isError = false"
            >
          </label>

          <label class="input input-accent mb-6 w-full" :class="{ 'input-error': isError }">
            <Icon
              name="tabler:lock-password"
              size="18"
              class="text-accent-content"
            />
            <input
              v-model="formData.password"
              :type="isPasswordShown ? 'text' : 'password'"
              required
              placeholder="Password"
              @input="isError = false"
            >
            <button type="button" @click.prevent="togglePasswordVisibility">
              <Icon
                :name="isPasswordShown ? 'tabler:eye-off' : 'tabler:eye'"
                size="18"
                class="text-accent-content"
              />
            </button>
          </label>

          <button type="submit" class="btn btn-accent mt-4">
            Sign In
          </button>
        </fieldset>
      </form>
    </div>

    <ToastNotification
      :is-message="isMessage"
      :is-error="isError"
      :response-message="responseMessage"
    />
  </div>
</template>
