<script setup lang="ts">
import type { Student } from '~~/server/lib/zod-schema';
import type { FetchError } from 'ofetch';

const isEditing = ref(false);
const showFormModal = ref(false);
const isSubmitting = ref(false);
const currentPage = ref(1);
const pageSize = 7;
const maxVisiblePages = 4;
const searchQuery = ref('');

const { isMessage, isError, responseMessage, showMessage } = useNotification();

const { data: students, pending, error, refresh } = useFetch('/api/private/student', { lazy: true });

const studentData = ref<Student>({
  first_name: '',
  middle_name: '',
  last_name: '',
  address: '',
  contact_number: '',
});

const filteredStudents = computed(() => {
  if (!students.value?.data)
    return [];
  if (!searchQuery.value)
    return students.value.data;

  return students.value.data.filter(s =>
    `${s.first_name} ${s.middle_name} ${s.last_name} ${s.address} ${s.contact_number}`
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase()),
  );
});

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredStudents.value.slice(start, start + pageSize);
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredStudents.value.length / pageSize));
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= maxVisiblePages) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: number[] = [];
  const half = Math.floor(maxVisiblePages / 2);

  let start = Math.max(2, current - half);
  let end = Math.min(total - 1, current + half);

  if (current <= half) {
    start = 2;
    end = maxVisiblePages;
  }
  else if (current >= total - half) {
    start = total - maxVisiblePages + 1;
    end = total - 1;
  }

  pages.push(1);
  if (start > 2)
    pages.push(-1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1)
    pages.push(-2);
  pages.push(total);

  return pages;
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
    let response;

    if (isEditing.value) {
      response = await $fetch(`/api/private/student/${studentData.value.id}`, {
        method: 'PUT',
        body: studentData.value,
      });
    }
    else {
      response = await $fetch('/api/private/student', {
        method: 'POST',
        body: studentData.value,
      });
    }

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

function updateStudent(student: Student) {
  studentData.value = { ...student };
  isEditing.value = true;
  showFormModal.value = true;
}

watch(searchQuery, () => {
  currentPage.value = 1;
});
</script>

<template>
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4 items-center">
      <p class="text-3xl">
        List of Students
      </p>
      <button class="btn btn-accent" @click="openAddStudentModal">
        <Icon name="solar:add-circle-linear" size="24" /> Add Student
      </button>
    </div>
    <div class="flex space-x-2 justify-end">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search students..."
        class="input input-bordered w-64"
      >
    </div>
    <table class="table">
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
          <td>{{ student.id }}</td>
          <td>{{ student.first_name }}</td>
          <td>{{ student.middle_name }}</td>
          <td>{{ student.last_name }}</td>
          <td>{{ student.address }}</td>
          <td>{{ student.contact_number }}</td>
          <td>
            <button
              class="btn btn-info btn-sm tooltip tooltip-info"
              data-tip="Update"
              @click="updateStudent(student)"
            >
              <Icon name="solar:smartphone-update-broken" size="16" />
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

      <template v-for="page in visiblePages" :key="page">
        <button
          v-if="page > 0"
          class="btn btn-sm"
          :class="{ 'btn-accent': currentPage === page }"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
        <span v-else class="px-2">…</span>
      </template>

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
