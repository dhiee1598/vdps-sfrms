<script setup lang="ts">
import { onMounted, ref } from 'vue';

const yearLevels = ref<any[]>([]);
const showModal = ref(false);
const isEditing = ref(false); // track mode
const editingId = ref<number | null>(null);

const formData = ref({
  name: '',
});

// fetch users
async function loadYearLevels() {
  yearLevels.value = await $fetch('/api/private/year-level', { method: 'GET' });
}

// call on mount
onMounted(() => {
  loadYearLevels();
});

async function handleClick() {
  try {
    if (isEditing.value && editingId.value) {
      // UPDATE
      const response = await $fetch(`/api/private/year-level/${editingId.value}`, {
        method: 'PUT',
        body: formData.value,
      });
      console.warn(response, 'update response');
    }
    else {
      // CREATE
      const response = await $fetch('/api/private/year-level', {
        method: 'POST',
        body: formData.value,
      });
      console.warn(response, 'create response');
    }

    // reset + reload
    showModal.value = false;
    isEditing.value = false;
    editingId.value = null;
    formData.value = { name: '' };
    await loadYearLevels();
  }
  catch (err) {
    console.error(err);
  }
}

function openCreateModal() {
  isEditing.value = false;
  editingId.value = null;
  formData.value = { name: '' };
  showModal.value = true;
}

function openEditModal(yearLevel: any) {
  isEditing.value = true;
  editingId.value = yearLevel.id;
  formData.value = { name: yearLevel.name };
  showModal.value = true;
}
</script>

<template>
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4">
      <p class="text-3xl">
        List of Year Level
      </p>
      <button class="btn btn-primary" @click="openCreateModal">
        Add
      </button>
    </div>
    <table class="table">
      <!-- head -->
      <thead>
        <tr>
          <th />
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        <!-- row 1 -->

        <tr v-for="yearLevel in yearLevels" :key="yearLevel.id">
          <th>{{ yearLevel.id }}</th>
          <td>{{ yearLevel.name }}</td>
          <td>
            <button class="btn btn-primary" @click="openEditModal(yearLevel)">
              update
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <dialog :open="showModal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{ isEditing ? 'Update Year Level' : 'Add Year Level' }}
        </h3>

        <div class="modal-action">
          <form class="flex flex-col gap-4 w-full" @submit.prevent="handleClick">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Year Level Name
              </legend>
              <input
                v-model="formData.name"
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
</template>
