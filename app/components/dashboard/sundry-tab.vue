<!-- components/dashboard/SundryTab.vue -->
<script setup lang="ts">
import { ref } from 'vue';

const { data: sundries, pending, error, refresh } = await useFetch('/api/private/sundries');
const { data: feeTypes } = await useFetch('/api/private/fee-types');
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

const formData = ref({
  name: '',
  description: '',
  amount: '',
  typeId: '',
});

async function handleClick() {
  console.warn(formData.value);
  try {
    if (isEditing.value && editingId.value) {
      // UPDATE
      await $fetch(`/api/private/sundries/${editingId.value}`, {
        method: 'PUT',
        body: formData.value,
      });
    }
    else {
      // CREATE
      await $fetch('/api/private/sundries', {
        method: 'POST',
        body: formData.value,
      });
    }

    // reset + reload
    showModal.value = false;
    isEditing.value = false;
    editingId.value = null;
    formData.value = { name: '', description: '', amount: '', typeId: '' };

    // refresh Nuxt data
    await refresh();
  }
  catch (err) {
    console.error(err);
  }
}

function openCreateModal() {
  isEditing.value = false;
  editingId.value = null;
  formData.value = { name: '', description: '', amount: '', typeId: '' };
  showModal.value = true;
}

function openEditModal(item: any) {
  isEditing.value = true;
  editingId.value = item.id;

  formData.value = {
    name: item.name,
    description: item.description,
    amount: item.amount,
    typeId: String(item.typeId), // store the raw typeId for the <select>
  };

  showModal.value = true;
}
</script>

<template>
  <div class="p-4">
    <div class="flex flex-row justify-between">
      <h2 class="text-xl font-bold mb-4">
        List of Sundries
      </h2>
      <button class="btn btn-primary" @click="openCreateModal">
        New Sundry
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
          <th>ID</th>
          <th>Name</th>
          <th>Amount (₱)</th>
          <th>Type</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in sundries" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.amount }}</td>
          <td>{{ item.feeTypeName }}</td>

          <td>
            <button class="btn btn-sm btn-primary" @click="openEditModal(item)">
              Edit
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
                v-model="formData.name"
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
                v-model="formData.description"
                type="text"
                class="input w-full"
                placeholder="Type here"
                required
              >
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Price
              </legend>
              <input
                v-model="formData.amount"
                type="text"
                class="input w-full"
                placeholder="Type here"
                required
              >
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Type
              </legend>
              <select
                v-model="formData.typeId"
                class="select w-full"
                required
              >
                <option value="">
                  Select a type
                </option>
                <option
                  v-for="type in feeTypes"
                  :key="type.id"
                  :value="String(type.id)"
                >
                  {{ type.name }}
                </option>
              </select>
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
    <!-- END MODAL -->
  </div>
</template>
