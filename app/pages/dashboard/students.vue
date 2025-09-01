<script setup lang="ts">
import type { Student } from '~~/server/lib/zod-schema';
import type { FetchError } from 'ofetch';

const isEditing = ref(false);
const showFormModal = ref(false);
const isSubmitting = ref(false);

const { isMessage, isError, responseMessage, showMessage } = useNotification();

const studentData = ref<Student>({
  first_name: '',
  middle_name: '',
  last_name: '',
  address: '',
  contact_number: '',
});

function openAddStudentModal() {
  isEditing.value = false;
  studentData.value = {
    first_name: '',
    middle_name: '',
    last_name: '',
    address: '',
    contact_number: '',
  };
  showFormModal.value = true;
}

async function handleFormSubmit() {
  isSubmitting.value = true;

  try {
    const response = await $fetch('/api/private/student', {
      method: 'POST',
      body: studentData.value,
    });
    showFormModal.value = false;
    showMessage(response.message, false);
  }
  catch (e) {
    const error = e as FetchError;
    showMessage(error.data.message || 'An unexpected error occurred.', true);
  }
  finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4">
      <p class="text-3xl">
        List of Students
      </p>
      <button class="btn btn-primary" @click="openAddStudentModal">
        <Icon name="solar:add-square-linear" size="24" />Add Student
      </button>
    </div>

    <dialog :open="showFormModal" class="modal">
      <div class="modal-box">
        <StudentForm
          v-model:student="studentData"
          :is-editing="isEditing"
          @submit="handleFormSubmit"
          @show-modal="showFormModal = false"
        />
      </div>
    </dialog>
    <ToastNotification
      :is-message="isMessage"
      :is-error="isError"
      :response-message="responseMessage"
    />
  </div>
</template>
