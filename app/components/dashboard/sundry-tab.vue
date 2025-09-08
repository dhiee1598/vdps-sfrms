<!-- components/dashboard/SundryTab.vue -->
<script setup lang="ts">
import type { FetchError } from 'ofetch';

import { ref } from 'vue';

const { data: sundries, pending, error, refresh } = await useFetch('/api/private/sundries');
const { isMessage, isError, responseMessage, showMessage } = useNotification();
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

const formData = ref({
  sundry_name: '',
  sundry_description: '',
  sundry_amount: '',
});

async function handleClick() {
  let response;
  try {
    if (isEditing.value && editingId.value) {
      // UPDATE
      response = await $fetch(`/api/private/sundries/${editingId.value}`, {
        method: 'PUT',
        body: formData.value,
      });
    }
    else {
      // CREATE
      response = await $fetch('/api/private/sundries', {
        method: 'POST',
        body: formData.value,
      });
    }

    showMessage(response.message, false);

    // reset + reload
    showModal.value = false;
    isEditing.value = false;
    editingId.value = null;
    formData.value = { sundry_name: '', sundry_description: '', sundry_amount: '' };

    // refresh Nuxt data
    await refresh();
  }
  catch (err) {
    const error = err as FetchError;

    showMessage(error.data.message || 'An unexpected error occurred.', true);
  }
}

function openCreateModal() {
  isEditing.value = false;
  editingId.value = null;
  formData.value = { sundry_name: '', sundry_description: '', sundry_amount: '' };
  showModal.value = true;
}

function openEditModal(item: any) {
  isEditing.value = true;
  editingId.value = item.id;

  formData.value = {
    sundry_name: item.sundry_name,
    sundry_description: item.sundry_description,
    sundry_amount: item.sundry_amount,
  };

  showModal.value = true;
}
</script>

<template>
  <div class="p-10 w-full">
    <div class="flex flex-row justify-between my-4">
      <p class="text-2xl">
        List of Sundries
      </p>
      <button class="btn btn-accent" @click="openCreateModal">
        <Icon name="solar:add-circle-linear" size="24" />Add Sundry
      </button>
    </div>

    <div v-if="pending">
      Loading...
    </div>
    <div v-else-if="error">
      Error loading courses
    </div>
    <table class="table w-full">
      <thead>
        <tr>
          <th class="w-1/5">
            ID
          </th>
          <th class="w-1/3">
            Name
          </th>
          <th class="w-full">
            Amount (₱)
          </th>
          <th class="w-1/5 " />
        </tr>
      </thead>
      <tbody>
        <tr v-for="sundry in sundries?.data" :key="sundry.id">
          <td>{{ sundry.id }}</td>
          <td>{{ sundry.sundry_name }}</td>
          <td>{{ sundry.sundry_amount }}</td>

          <td>
            <button
              class="btn btn-sm btn-info tooltip"
              data-tip="Update"
              @click="openEditModal(sundry)"
            >
              <Icon name="solar:smartphone-update-broken" size="16" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- MODAL -->

    <dialog :open="showModal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{ isEditing ? 'Update Sundry' : 'Add Sundry' }}
        </h3>

        <div class="modal-action">
          <form class="flex flex-col gap-4 w-full" @submit.prevent="handleClick">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Sundry Name
              </legend>
              <input
                v-model="formData.sundry_name"
                type="text"
                class="input w-full"
                placeholder="Type here"
                required
              >
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Description
              </legend>
              <input
                v-model="formData.sundry_description"
                type="text"
                class="input w-full"
                placeholder="Type here"
              >
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Amount
              </legend>
              <input
                v-model="formData.sundry_amount"
                type="number"
                step="0.01"
                class="input w-full"
                placeholder="Type here"
                required
              >
            </fieldset>

            <div class="flex flex-row justify-end gap-2">
              <button type="submit" class="btn btn-accent">
                {{ isEditing ? 'Update' : 'Create' }}
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
    <!-- END MODAL -->
  </div>
  <ToastNotification
    :is-message="isMessage"
    :is-error="isError"
    :response-message="responseMessage"
  />
</template>
