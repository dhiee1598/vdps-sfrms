<script setup lang="ts">
import type { Student } from '~~/server/lib/zod-schema';
import type { FetchError } from 'ofetch';

const isEditing = ref(false);
const showFormModal = ref(false);
const isSubmitting = ref(false);
const currentPage = ref(1);
const pageSize = 8;

const { isMessage, isError, responseMessage, showMessage } = useNotification();

const { data: students, pending, error, refresh } = useFetch('/api/private/student', { lazy: true });

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
    await refresh();
  }
  catch (e) {
    const error = e as FetchError;
    showMessage(error.data.message || 'An unexpected error occurred.', true);
  }
  finally {
    isSubmitting.value = false;
  }
}

const paginatedStudents = computed(() => {
  if (!students.value?.data)
    return [];
  const start = (currentPage.value - 1) * pageSize;
  return students.value.data.slice(start, start + pageSize);
});

const totalPages = computed(() => {
  if (!students.value?.data)
    return 1;
  return Math.ceil(students.value.data.length / pageSize);
});
</script>

<template>
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4">
      <p class="text-3xl">
        List of Students
      </p>
      <button class="btn btn-primary" @click="openAddStudentModal">
        <Icon name="solar:add-square-linear" size="24" /> Add Student
      </button>
    </div>

    <table class="table table-xs table-pin-rows bg-base-200">
      <thead>
        <tr>
          <th>ID</th>
          <th>First Name</th>
          <th>Middle Name</th>
          <th>Last Name</th>
          <th>Address</th>
          <th>Contact</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="pending">
          <td colspan="7" class="text-center py-4">
            <span class="loading loading-ring loading-lg" />
          </td>
        </tr>

        <tr v-else-if="error">
          <td colspan="7" class="text-center text-red-500 py-4">
            Failed to load students. Please try again.
          </td>
        </tr>

        <tr
          v-for="student in paginatedStudents"
          v-else
          :key="student.id"
        >
          <th>{{ student.id }}</th>
          <td>{{ student.first_name }}</td>
          <td>{{ student.middle_name }}</td>
          <td>{{ student.last_name }}</td>
          <td>{{ student.address }}</td>
          <td>{{ student.contact_number }}</td>
          <td>
            <button class="btn btn-primary btn-sm">
              Update
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="flex justify-center mt-4 space-x-2">
      <button
        class="btn btn-sm"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        Prev
      </button>
      <button
        v-for="page in totalPages"
        :key="page"
        class="btn btn-sm"
        :class="{ 'btn-active': currentPage === page }"
        @click="currentPage = page"
      >
        {{ page }}
      </button>
      <button
        class="btn btn-sm"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        Next
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
