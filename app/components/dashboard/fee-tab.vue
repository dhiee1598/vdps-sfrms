<!-- components/dashboard/SundryTab.vue -->
<script setup lang="ts">
import type { FetchError } from 'ofetch';

const { data: fees, pending, error, refresh } = await useFetch('/api/private/fees');

const { isMessage, isError, responseMessage, showMessage } = useNotification();

const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

const formData = ref({
  fee_name: '',
  fee_amount: '',
  fee_description: '',
});

async function handleClick() {
  let response;
  try {
    if (isEditing.value && editingId.value) {
      // UPDATE
      response = await $fetch(`/api/private/fees/${editingId.value}`, {
        method: 'PUT',
        body: formData.value,
      });
    }
    else {
      // CREATE
      response = await $fetch('/api/private/fees', {
        method: 'POST',
        body: formData.value,
      });
    }

    showMessage(response.message, false);

    // refresh Nuxt data
    await refresh();

    // reset + close modal
    resetForm();
  }
  catch (err) {
    const error = err as FetchError;
    showMessage(error.data.message || 'An unexpected error occurred.', true);
  }
}

function openEditModal(fee: any) {
  isEditing.value = true;
  editingId.value = fee.id;
  formData.value = {
    fee_name: fee.fee_name,
    fee_amount: fee.fee_amount,
    fee_description: fee.fee_description,
  };
  showModal.value = true;
}

function openNewModal() {
  resetForm();
  showModal.value = true;
}

function resetForm() {
  isEditing.value = false;
  editingId.value = null;
  formData.value = { fee_name: '', fee_amount: '', fee_description: '' };
  showModal.value = false;
}
</script>

<template>
  <div class="p-10 w-full">
    <div class="flex flex-row justify-between my-4">
      <h2 class="text-3xl">
        List of Fees
      </h2>
      <button class="btn btn-accent" @click="openNewModal">
        <Icon name="solar:add-circle-linear" size="24" />New Fee
      </button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex justify-center items-center py-10">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error shadow-lg">
      <span>Failed to load fees: {{ error.message }}</span>
    </div>

    <!-- Empty -->
    <div v-else-if="fees?.data.length === 0" class="flex justify-center items-center py-10 shadow-lg">
      <span class="font-bold">NO FEE FOUND</span>
    </div>

    <!-- Data Table -->
    <div v-else class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr>
            <th class="w-1/8">
              ID
            </th>
            <th class="w-1/3">
              Name
            </th>
            <th class="w-1/3">
              Description
            </th>
            <th class="w-full">
              Amount
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in fees?.data" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.fee_name }}</td>
            <td>{{ item.fee_description }}</td>
            <td>{{ item.fee_amount }}</td>
            <td>
              <button
                class="btn btn-sm btn-info tooltip tooltip-info"
                data-tip="Update"
                @click="openEditModal(item)"
              >
                <Icon name="solar:smartphone-update-broken" size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- MODAL -->
    <dialog :open="showModal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{ isEditing ? 'Update Fee Type' : 'Add Fee Type' }}
        </h3>

        <form
          class="flex flex-col gap-4 w-full mt-4"
          method="dialog"
          @submit.prevent="handleClick"
        >
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              Fee Name
            </legend>
            <input
              v-model="formData.fee_name"
              type="text"
              class="input w-full"
              placeholder="Type here"
              required
            >
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              Fee Description
            </legend>
            <input
              v-model="formData.fee_description"
              type="text"
              class="input w-full"
              placeholder="Type here"
            >
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">
              Fee Amount
            </legend>
            <input
              v-model="formData.fee_amount"
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
              @click="resetForm"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </dialog>
  </div>
  <ToastNotification
    :is-message="isMessage"
    :is-error="isError"
    :response-message="responseMessage"
  />
</template>
