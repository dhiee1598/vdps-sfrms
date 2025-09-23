<script setup lang="ts">
import type { FetchError } from 'ofetch';

import { ref } from 'vue';

// auto-fetch year levels
const { data: sections, pending, error, refresh } = await useFetch('/api/private/section');

const { isMessage, isError, responseMessage, showMessage } = useNotification();
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);
const isSubmitting = ref(false);
const formData = ref({
  section_name: '',
});

async function handleClick() {
  isSubmitting.value = true;

  if (!formData.value.section_name) {
    showMessage('Please enter an academic year.', true);
    return;
  }

  try {
    let response;

    if (isEditing.value && editingId.value) {
      // UPDATE
      response = await $fetch(`/api/private/section/${editingId.value}`, {
        method: 'PUT',
        body: formData.value,
      });
    }
    else {
      // CREATE
      response = await $fetch('/api/private/section', {
        method: 'POST',
        body: formData.value,
      });
    }

    showMessage(response.message, false);

    // reset
    showModal.value = false;
    isEditing.value = false;
    editingId.value = null;
    formData.value = { section_name: '' };

    // refresh list
    await refresh();
  }
  catch (err) {
    const error = err as FetchError;

    showMessage(error.data.message || 'An unexpected error occurred.', true);
  }
  finally {
    isSubmitting.value = false;
  }
}

function openCreateModal() {
  isEditing.value = false;
  editingId.value = null;
  formData.value = { section_name: '' };
  showModal.value = true;
}

function openEditModal(academicYear: any) {
  isEditing.value = true;
  editingId.value = academicYear.id;
  formData.value = { section_name: academicYear.section_name };
  showModal.value = true;
}
</script>

<template>
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4">
      <p class="text-3xl">
        List of Sections
      </p>
      <button class="btn btn-accent" @click="openCreateModal">
        <Icon name="solar:add-circle-linear" size="24" /> Add Section
      </button>
    </div>

    <div v-if="pending && !sections?.data">
      Loading...
    </div>
    <div v-else-if="error">
      Error loading year levels
    </div>

    <table v-else class="table">
      <thead>
        <tr>
          <th class="w-1/3">
            ID
          </th>
          <th class="w-1/3">
            Name
          </th>
          <th class="w-1/3">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in sections?.data" :key="item.id">
          <th>{{ item.id }}</th>
          <td>{{ item.section_name }}</td>
          <td>
            <button
              class="btn btn-info btn-sm tooltip tooltip-info"
              data-tip="Update"
              @click="openEditModal(item)"
            >
              <Icon name="solar:smartphone-update-broken" size="16" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <dialog :open="showModal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{ isEditing ? 'Update Section' : 'Add Section' }}
        </h3>

        <div class="modal-action">
          <form class="flex flex-col gap-4 w-full" @submit.prevent="handleClick">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Section Name
              </legend>
              <input
                v-model="formData.section_name"
                type="text"
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
  </div>
  <ToastNotification
    :is-message="isMessage"
    :is-error="isError"
    :response-message="responseMessage"
  />
</template>
