<script setup lang="ts">
import type { FetchError } from 'ofetch';

import { ref } from 'vue';

const { data: strands, pending, error, refresh } = await useFetch('/api/private/strands');

const { isMessage, isError, responseMessage, showMessage } = useNotification();

const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

const formData = ref({
  strand_name: '',
  strand_description: '',
});

async function handleClick() {
  let response;
  try {
    if (isEditing.value && editingId.value) {
      // UPDATE
      response = await $fetch(`/api/private/strands/${editingId.value}`, {
        method: 'PUT',
        body: formData.value,
      });
    }
    else {
      // CREATE
      response = await $fetch('/api/private/strands', {
        method: 'POST',
        body: formData.value,
      });
    }

    showMessage(response.message, false);
    // reset + reload
    showModal.value = false;
    isEditing.value = false;
    editingId.value = null;
    formData.value = { strand_name: '', strand_description: '' };

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
  formData.value = { strand_name: '', strand_description: '' };
  showModal.value = true;
}

function openEditModal(strand: any) {
  isEditing.value = true;
  editingId.value = strand.id;
  formData.value = {
    strand_name: strand.strand_name,
    strand_description: strand.strand_description,
  };
  showModal.value = true;
}
</script>

<template>
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4">
      <p class="text-3xl">
        List of Strands
      </p>
      <button class="btn btn-accent" @click="openCreateModal">
        <Icon name="solar:add-circle-linear" size="24" />Add Strand
      </button>
    </div>

    <div v-if="pending">
      Loading...
    </div>
    <div v-else-if="error">
      Error loading courses
    </div>
    <table v-else class="table">
      <thead>
        <tr>
          <th class="w-1/3">
            ID
          </th>
          <th class="w-1/3">
            Strand Name
          </th>
          <th class="w-full">
            Strand Description
          </th>
          <th class="1" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="strand in strands" :key="strand.id">
          <th>{{ strand.id }}</th>
          <td>{{ strand.strand_name }}</td>
          <td>{{ strand.strand_description }}</td>
          <td>
            <button class="btn btn-info btn-sm" @click="openEditModal(strand)">
              Update <Icon name="solar:smartphone-update-broken" size="16" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <dialog :open="showModal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{ isEditing ? 'Update Course' : 'Add Course' }}
        </h3>

        <div class="modal-action">
          <form class="flex flex-col gap-4 w-full" @submit.prevent="handleClick">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Strand Name
              </legend>
              <input
                v-model="formData.strand_name"
                type="text"
                class="input w-full"
                placeholder="Type here"
                required
              >
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Strand Description
              </legend>
              <input
                v-model="formData.strand_description"
                type="text"
                class="input w-full"
                placeholder="Type here"
                required
              >
            </fieldset>

            <div class="flex flex-row justify-end gap-2">
              <button type="submit" class="btn btn-primary">
                {{ isEditing ? 'Update' : 'Create' }}
              </button>
              <button
                type="button"
                class="btn btn-warning"
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
  <ToastNotification
    :is-message="isMessage"
    :is-error="isError"
    :response-message="responseMessage"
  />
</template>
