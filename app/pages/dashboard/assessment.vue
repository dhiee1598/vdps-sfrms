<script setup lang="ts">
import type { Assessment } from '~~/server/lib/zod-schema';
import type { FetchError } from 'ofetch';

const isEditing = ref(false);
const showFormModal = ref(false);
const showViewModal = ref(false);
const isSubmitting = ref(false);
const selectedStudentAssessment = ref();

const { isMessage, isError, responseMessage, showMessage } = useNotification();
const { data: studentAssessments, pending, error, refresh } = useFetch('/api/private/assessment', { lazy: true });

const assessmentData = ref<Assessment>({
  enrollment_id: null,
  student_id: '',
  fees: [],
  total_fees: 0,
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
      <div class="flex space-x-2">
        <input
          type="text"
          placeholder="Search students..."
          class="input input-bordered w-64"
        >
        <button class="btn btn-primary" @click="openAddStudentAssessment">
          <Icon name="solar:add-square-linear" size="24" /> Assess Student
        </button>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>First Name</th>
          <th>Middle Name</th>
          <th>Last Name</th>
          <th>Total Fees</th>
          <th>Balance</th>
          <th>Remaining</th>
          <th class="text-center">
            Action
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="pending">
          <td colspan="8" class="text-center py-4">
            <span class="loading loading-ring loading-lg" />
          </td>
        </tr>
        <tr v-else-if="error">
          <td colspan="7" class="text-center text-red-500 py-4">
            Failed to load students. Please try again.
          </td>
        </tr>

        <tr
          v-for="item in studentAssessments?.data"
          v-else
          :key="item.id"
        >
          <td>{{ item?.id }}</td>
          <td>{{ item?.student.first_name }}</td>
          <td>{{ item?.student.middle_name }}</td>
          <td>{{ item?.student.last_name }}</td>
          <td>{{ item?.total_amount_due }}</td>
          <td>
            {{
              Number(
                item.payments?.reduce((sum: number, p: { amount: string | number }) => sum + Number(p.amount), 0),
              ).toFixed(2)
            }}
          </td>

          <td>
            {{
              (
                Number(item.total_amount_due)
                - item.payments?.reduce((sum: number, p: { amount: string | number }) => sum + Number(p.amount), 0)
              ).toFixed(2)
            }}
          </td>
          <td class="flex gap-2 justify-center items-center">
            <button class="btn btn-sm btn-success" @click="openViewStudentAssessment(item)">
              <Icon name="solar:eye-linear" size="24" />
            </button>
          </td>
        </tr>
      </tbody>
    </table>

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
