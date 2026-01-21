<script setup lang="ts">
import type { FetchError } from 'ofetch';

import { v4 as uuidv4 } from 'uuid';

const emit = defineEmits<{
  (e: 'showModal'): void;
  (e: 'showMessage', message: string, isErrorType: boolean): void;
}>();

const selectedStudent = ref();
const isSubmitting = ref(false);
const formData = ref({
  transaction_id: '',
  student_id: '',
  total_amount: 0,
  status: 'paid',
  transaction_items: [] as any[],
});

// Fetch data
const { data: enrollments } = useFetch('/api/private/enrollment?pageSize=1000');
const { data: sundriesData } = useFetch('/api/private/sundries');

const sundryList = computed(() => sundriesData.value?.data || []);

const students = computed(() => {
  // Use enrollments directly. Ensure uniqueness if needed, but typically one active enrollment per student.
  if (!enrollments.value?.data)
    return [];
  return enrollments.value.data;
});

watch(selectedStudent, (student) => {
  if (student) {
    formData.value = {
      transaction_id: uuidv4(),
      student_id: student.student_id, // Enrollment object has student_id
      total_amount: 0,
      status: 'paid',
      transaction_items: [],
    };
  }
});

// Toggle Sundry Logic
function toggleSundry(sundry: { sundry_name: string; sundry_amount: string }) {
  const items = formData.value.transaction_items;
  const existingIndex = items.findIndex(
    (item: any) => item.item_type === sundry.sundry_name,
  );

  if (existingIndex !== -1) {
    items.splice(existingIndex, 1);
  }
  else {
    items.push({
      item_type: sundry.sundry_name,
      amount: Number(sundry.sundry_amount) || 0,
    });
  }
  recalculateTotal();
}

function recalculateTotal() {
  const total = formData.value.transaction_items.reduce((sum, item) => sum + item.amount, 0);
  formData.value.total_amount = Math.round((total + Number.EPSILON) * 100) / 100;
}

async function handleSubmit() {
  if (formData.value.total_amount <= 0) {
    emit('showMessage', 'Please select at least one item to pay.', true);
    return;
  }

  isSubmitting.value = true;
  try {
    const response = await $fetch(`/api/private/transactions`, {
      method: 'POST',
      body: formData.value,
    });

    selectedStudent.value = null;
    emit('showMessage', response.message, false);
    emit('showModal');
    // Reset
    formData.value = {
      transaction_id: '',
      student_id: '',
      total_amount: 0,
      status: 'paid',
      transaction_items: [],
    };
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
          <li><span class="font-medium">Grade Level:</span> {{ selectedStudent?.grade_level || 'N/A' }}</li>
          <li><span class="font-medium">Strand:</span> {{ selectedStudent?.strand_name || 'N/A' }}</li>
          <li><span class="font-medium">Academic Year:</span> {{ selectedStudent?.academic_year || 'N/A' }}</li>
        </ul>
      </div>
    </div>

    <!-- Sundry Selection -->
    <div v-if="selectedStudent" class="mt-6 bg-base-100 p-4 rounded-lg border border-base-300">
      <p class="text-sm font-bold mb-2">
        Select Payment Items (Sundries)
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto">
        <div
          v-for="sundry in sundryList"
          :key="sundry.id"
          class="form-control bg-base-200 rounded-md p-2"
        >
          <label class="cursor-pointer label justify-start gap-2">
            <input
              type="checkbox"
              class="checkbox checkbox-sm"
              :checked="formData.transaction_items.some((i:any) => i.item_type === sundry.sundry_name)"
              @change="toggleSundry(sundry)"
            >
            <span class="label-text flex-1">{{ sundry.sundry_name }}</span>
            <span class="label-text font-bold">₱{{ sundry.sundry_amount }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Transaction Details -->
    <div class="mt-6 bg-base-300 p-4 rounded-lg">
      <p class="text-sm text-gray-400 mb-2">
        Transaction Details
      </p>

      <dl class="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm">
        <dt class="font-medium">
          Transaction ID:
        </dt> <dd>
          {{ formData.transaction_id }}
        </dd>

        <dt class="font-medium">
          Total Amount:
        </dt>
        <dd class="text-success font-semibold text-xl">
          ₱ {{ formData.total_amount.toFixed(2) }}
        </dd>
      </dl>
    </div>

    <!-- Transaction Items Table -->
    <div v-if="formData.transaction_items.length > 0" class="mt-6">
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
            <tr v-for="(item, idx) in formData.transaction_items" :key="idx">
              <td>{{ item.item_type }}</td>
              <td class="text-right">
                ₱ {{ item.amount.toFixed(2) }}
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
        :disabled="!selectedStudent || isSubmitting || formData.total_amount <= 0"
        @click="handleSubmit"
      >
        {{ isSubmitting ? 'Submitting...' : 'Submit Transaction' }}
      </button>
    </div>
  </div>
</template>
