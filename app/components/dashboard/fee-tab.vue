<!-- components/dashboard/SundryTab.vue -->
<script setup lang="ts">
const { data: feeTypes, pending, error, refresh } = await useFetch('/api/private/fee-types');

const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

const formData = ref({
  name: '',
});

async function handleClick() {
  try {
    if (isEditing.value && editingId.value) {
      // UPDATE
      await $fetch(`/api/private/fee-types/${editingId.value}`, {
        method: 'PUT',
        body: formData.value,
      });
    }
    else {
      // CREATE
      await $fetch('/api/private/fee-types', {
        method: 'POST',
        body: formData.value,
      });
    }

    // refresh Nuxt data
    await refresh();

    // reset + close modal
    resetForm();
  }
  catch (err) {
    console.error(err);
  }
}

function openEditModal(feeType: any) {
  isEditing.value = true;
  editingId.value = feeType.id;
  formData.value = {
    name: feeType.name,
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
  formData.value = { name: '' };
  showModal.value = false;
}
</script>

<template>
  <div class="p-4 w-full">
    <div class="flex flex-row justify-between">
      <h2 class="text-xl font-bold mb-4">
        List of Fee Types
      </h2>
      <button class="btn btn-primary" @click="openNewModal">
        <Icon name="solar:add-circle-linear" size="24" />New Fee
      </button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex justify-center items-center py-10">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="alert alert-error shadow-lg">
      <span>⚠️ Failed to load fees: {{ error.message }}</span>
    </div>

    <!-- Empty -->
    <div v-else-if="!feeTypes?.length" class="flex justify-center items-center py-10 shadow-lg">
      <span class="font-bold">NO FEE FOUND</span>
    </div>

    <!-- Data Table -->
    <div v-else class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr>
            <th class="w-1/3">
              ID
            </th>
            <th class="w-full">
              Name
            </th>
            <th class="w-1" />
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in feeTypes" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.name }}</td>
            <td>
              <button class="btn btn-sm btn-primary" @click="openEditModal(item)">
                Edit
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
              Fee Type Name
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
              @click="resetForm"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </dialog>
  </div>
</template>
