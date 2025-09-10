<script setup lang="ts">
import type { FetchError } from 'ofetch';

const emit = defineEmits<{
  (e: 'showModal'): void;
  (e: 'showMessage', message: string, isErrorType: boolean): void;
}>();

const selectedStudent = ref();
const isSubmitting = ref(false);
const formData = ref({
  assessment_id: '',
  student_id: '',
  total_amount: 0,
  status: 'paid',
  transaction_items: [{
    item_type: 'Fullpayment',
    amount: 0,
  }],
});

const { data: assessments } = await useFetch('/api/private/assessment?allAssessments=true');

const students = computed(() => {
  const uniqueStudents = new Map();

  assessments.value?.data.forEach((assessment) => {
    const due = Number.parseFloat(assessment.total_amount_due);
    const paid = Number.parseFloat(assessment.total_paid);

    if (due !== paid) {
      const studentId = assessment.student.id || assessment.student.student_id; // adjust if necessary

      if (!uniqueStudents.has(studentId)) {
        uniqueStudents.set(studentId, assessment.student);
      }
    }
  });

  return Array.from(uniqueStudents.values());
});

const unpaidAssessmentsForSelectedStudent = computed(() => {
  if (!selectedStudent.value)
    return [];

  return assessments.value?.data.filter((assessment) => {
    const due = Number.parseFloat(assessment.total_amount_due);
    const paid = Number.parseFloat(assessment.total_paid);
    const studentId = assessment.student.id || assessment.student.student_id;

    return studentId === selectedStudent.value.id && due !== paid;
  }) ?? [];
});

const selectedAssessment = computed(() => {
  return unpaidAssessmentsForSelectedStudent.value[0] || null;
});

watch(selectedAssessment, (assessment) => {
  if (assessment && selectedStudent.value) {
    const balance = Number(assessment.total_amount_due) - Number(assessment.total_paid);

    formData.value = {
      assessment_id: assessment.id,
      student_id: selectedStudent.value.id,
      total_amount: balance,
      status: 'paid',
      transaction_items: [{
        item_type: 'Fullpayment',
        amount: balance,
      }],
    };
  }
});

async function handleSubmit() {
  isSubmitting.value = true;
  try {
    const response = await $fetch(`/api/private/transactions`, {
      method: 'POST',
      body: formData.value,
    });

    emit('showMessage', response.message, false);

    emit('showModal');
  }
  catch (e) {
    const error = e as FetchError;
    emit('showMessage', error.data.message || 'An unexpected error occurred.', true);
  }
  finally {
    isSubmitting.value = false;
  }
}
</script>

<template class="w-full">
  <p class="py-4">
    Select a student to generate a transaction
  </p>
  <div class="my-2">
    <select
      v-model="selectedStudent"
      class="select select-bordered w-full"
    >
      <option
        v-for="student in students"
        :key="student.id"
        :value="student"
      >
        {{ student.first_name }} {{ student.last_name }}
      </option>
    </select>
  </div>
  <div class="modal-box w-full max-w-5xl bg-base-200 text-base-content rounded-xl shadow-xl">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-base-300 pb-3">
      <h3 class="text-xl font-semibold flex items-center gap-2">
        <Icon
          name="solar:document-add-linear"
          size="22"
        />
        Transaction Summary
      </h3>
    </div>

    <!-- Student & Enrollment Details -->
    <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-base-300 p-4 rounded-lg">
        <p class="text-sm text-gray-400 mb-2">
          Student Information
        </p>
        <ul class="text-sm space-y-1">
          <li><span class="font-medium">ID:</span> {{ selectedStudent?.id }}</li>
          <li><span class="font-medium">Name:</span> {{ selectedStudent?.first_name }} {{ selectedStudent?.middle_name }} {{ selectedStudent?.last_name }}</li>
          <li><span class="font-medium">Address:</span> {{ selectedStudent?.address || 'N/A' }}</li>
        </ul>
      </div>

      <div class="bg-base-300 p-4 rounded-lg">
        <p class="text-sm text-gray-400 mb-2">
          Enrollment Information
        </p>
        <ul class="text-sm space-y-1">
          <li><span class="font-medium">Grade Level:</span> {{ selectedAssessment?.grade_level || 'N/A' }}</li>
          <li><span class="font-medium">Strand:</span> {{ selectedAssessment?.strand || 'N/A' }}</li>
          <li><span class="font-medium">Semester:</span> {{ selectedAssessment?.semester || 'N/A' }}</li>
          <li><span class="font-medium">Academic Year:</span> {{ selectedAssessment?.academic_year || 'N/A' }}</li>
        </ul>
      </div>
    </div>

    <!-- Transaction Details -->
    <div class="mt-6 bg-base-300 p-4 rounded-lg">
      <p class="text-sm text-gray-400 mb-2">
        Transaction Details
      </p>
      <dl class="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm">
        <dt class="font-medium">
          Status:
        </dt>
        <dd>
          <span class="badge badge-warning badge-sm">{{ selectedAssessment ? "Unpaid" : "N/A" }}</span>
        </dd>

        <dt class="font-medium">
          Total Amount:
        </dt>
        <dd class="text-success font-semibold">
          ₱ {{ selectedAssessment ? selectedAssessment.total_amount_due - selectedAssessment.total_paid : "N/A" }}
        </dd>
      </dl>
    </div>

    <!-- Transaction Items Table -->
    <div class="mt-6">
      <p class="text-sm text-gray-400 mb-2">
        Payment Breakdown
      </p>
      <div class="overflow-x-auto">
        <table class="table w-full table-sm">
          <thead>
            <tr>
              <th>Payment Type</th>
              <th class="text-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Full Payment</td>
              <td class="text-right">
                ₱ {{ selectedAssessment ? selectedAssessment.total_amount_due - selectedAssessment.total_paid : "N/A" }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div class="modal-action flex justify-end gap-3 mt-6">
      <button class="btn btn-outline" @click="emit('showModal')">
        Close
      </button>

      <button
        class="btn btn-accent"
        :disabled="!selectedStudent || isSubmitting"
        @click="handleSubmit"
      >
        {{ isSubmitting ? 'Submitting...' : 'Submit Transaction' }}
      </button>
    </div>
  </div>
</template>
