<script setup lang="ts">
import type { Assessment } from '~~/server/lib/zod-schema';
import type { FetchError } from 'ofetch';

const isEditing = ref(false);
const showFormModal = ref(false);
const showViewModal = ref(false);
const isSubmitting = ref(false);
const selectedStudentAssessment = ref();
const currentPage = ref(1);
const pageSize = 8;
const maxVisiblePages = 4;
const searchQuery = ref('');

const debouncedSearch = ref('');
let searchTimeout: NodeJS.Timeout;

watch(searchQuery, (newVal) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newVal;
    currentPage.value = 1;
  }, 300);
});

const { isMessage, isError, responseMessage, showMessage } = useNotification();
const { data: studentAssessments, pending, error, refresh } = useFetch('/api/private/assessment', {
  lazy: true,
  query: computed(() => ({
    page: currentPage.value,
    pageSize,
    search: debouncedSearch.value,
  })),
});

const assessmentData = ref<Assessment>({
  enrollment_id: null,
  student_id: '',
  fees: [],
  total_fees: 0,
});

const totalPages = computed(() => {
  return studentAssessments.value?.totalPages || 1;
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

function openAddStudentAssessment() {
  isEditing.value = false;
  showFormModal.value = true;
  assessmentData.value = {
    enrollment_id: null,
    student_id: '',
    fees: [],
    total_fees: 0,
  };
}

function openViewStudentAssessment(studentAssessment: any) {
  selectedStudentAssessment.value = studentAssessment;
  showViewModal.value = true;
}

async function handleFormSubmit() {
  isSubmitting.value = true;
  try {
    const response = await $fetch('/api/private/assessment', { method: 'POST', body: assessmentData.value });

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
</script>

<template>
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4 items-center">
      <p class="text-3xl">
        List of Student Assessment
      </p>
      <button class="btn btn-accent" @click="openAddStudentAssessment">
        <Icon name="solar:add-circle-linear" size="24" /> Assess Student
      </button>
    </div>

    <div class="flex space-x-2 justify-end">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search students..."
        class="input input-bordered w-72"
      >
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>First Name</th>
          <th>Middle Name</th>
          <th>Last Name</th>
          <th>Total Fees</th>
          <th class="text-center">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="pending">
          <td colspan="6" class="text-center py-4">
            <span class="loading loading-ring loading-lg" />
          </td>
        </tr>
        <tr v-else-if="error">
          <td colspan="6" class="text-center text-red-500 py-4">
            Failed to load students. Please try again.
          </td>
        </tr>

        <tr
          v-for="item in studentAssessments?.data || []"
          v-else
          :key="item.id"
        >
          <td>{{ item?.id }}</td>
          <td>{{ item?.student.first_name }}</td>
          <td>{{ item?.student.middle_name }}</td>
          <td>{{ item?.student.last_name }}</td>
          <td>{{ item?.total_amount_due }}</td>
          <td class="flex gap-2 justify-center items-center">
            <button
              class="btn btn-sm btn-success tooltip"
              data-tip="View"
              @click="openViewStudentAssessment(item)"
            >
              <Icon name="solar:eye-linear" size="16" />
            </button>
          </td>
        </tr>
        <tr v-if="(studentAssessments?.data || []).length === 0">
          <td colspan="6" class="text-center text-gray-500 py-4">
            No students found
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
        <AssessmentForm
          v-model:assessment="assessmentData"
          :is-editing="isEditing"
          @submit="handleFormSubmit"
          @show-modal="showFormModal = false"
        />
      </div>
    </dialog>

    <dialog :open="showViewModal" class="modal">
      <div class="modal-box w-11/12 max-w-5xl">
        <ViewAssessment :data="selectedStudentAssessment" @show-modal="showViewModal = false" />
      </div>
    </dialog>

    <ToastNotification
      :is-message="isMessage"
      :is-error="isError"
      :response-message="responseMessage"
    />
  </div>
</template>
