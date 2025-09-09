<script setup lang="ts">
import type { FetchError } from 'ofetch';

import { ref } from 'vue';

// auto-fetch year levels
const { data: semesters, pending, error, refresh } = await useFetch('/api/private/semesters');
const { isMessage, isError, responseMessage, showMessage } = useNotification();

const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

const formData = ref({
  semester: '',
});

async function handleClick() {
  let response;
  try {
    if (isEditing.value && editingId.value) {
      // UPDATE
      response = await $fetch(`/api/private/semesters/${editingId.value}`, {
        method: 'PUT',
        body: formData.value,
      });
    }
    else {
      // CREATE
      response = await $fetch('/api/private/semesters', {
        method: 'POST',
        body: formData.value,
      });
    }
    showMessage(response.message, false);
    // reset
    showModal.value = false;
    isEditing.value = false;
    editingId.value = null;
    formData.value = { semester: '' };

    // refresh list
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
  formData.value = { semester: '' };
  showModal.value = true;
}

function openEditModal(semester: any) {
  isEditing.value = true;
  editingId.value = semester.id;
  formData.value = { semester: semester.semester };
  showModal.value = true;
}

async function toggleStatus(id: number, newStatus: boolean) {
  let response;
  try {
    response = await $fetch(`/api/private/semesters/${id}`, {
      method: 'PUT',
      body: { status: newStatus },
    });
    showMessage(response.message, false);
    refresh(); // re-fetch the list
  }
  catch (err) {
    const error = err as FetchError;
    showMessage(error.data.message || 'An unexpected error occurred.', true);
  }
}
</script>

<template>
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4">
      <p class="text-2xl">
        List of Semesters
      </p>
      <button class="btn btn-accent" @click="openCreateModal">
        <Icon name="solar:add-circle-linear" size="24" /> Add Semesters
      </button>
    </div>

    <div v-if="pending && !semesters?.data">
      Loading...
    </div>
    <div v-else-if="error">
      Error loading Semesters
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
          <th class="w-full">
            Status
          </th>
          <th class="w-1" />
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in semesters?.data" :key="item.id">
          <th>{{ item.id }}</th>
          <td>{{ item.semester }}</td>
          <td>
            <input
              type="checkbox"
              class="toggle toggle-success"
              :disabled="item.status"
              :checked="item.status"
              @change="toggleStatus(item.id, !item.status)"
            >
          </td>
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
          {{ isEditing ? 'Update Academic Level' : 'Add Academic Level' }}
        </h3>

        <div class="modal-action">
          <form class="flex flex-col gap-4 w-full" @submit.prevent="handleClick">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Semester Name
              </legend>
              <input
                v-model="formData.semester"
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
