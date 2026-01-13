<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  data: any;
}>();

const emit = defineEmits<{
  (e: 'showModal'): void;
}>();

const { data: academicYears } = await useFetch('/api/private/academic-years?activeYear=true');

const localStudentAssessment = ref(props.data);

watch(() => props.data, (newVal) => {
  localStudentAssessment.value = newVal;
});

const totalPaid = computed(() => {
  if (!localStudentAssessment.value || !localStudentAssessment.value.payments || localStudentAssessment.value.payments.length === 0) {
    return 0;
  }
  return localStudentAssessment.value.payments.reduce((sum: any, payment: any) => sum + Number.parseFloat(payment.amount_paid), 0);
});

const balance = computed(() => {
  if (!localStudentAssessment.value) {
    return 0;
  }
  return Number.parseFloat(localStudentAssessment.value.total_amount_due) - totalPaid.value;
});
</script>

<template>
  <div v-if="localStudentAssessment">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold">
        Student Assessment
      </h2>
      <button
        type="button"
        class="btn btn-error rounded-full p-2"
        @click="emit('showModal')"
      >
        <Icon name="solar:close-circle-bold" size="25" />
      </button>
    </div>

    <div class="mb-6 border-b border-accent-content pb-4">
      <h3 class="text-xl font-medium mb-2">
        Student Information
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span class="font-light">Name:</span> {{ localStudentAssessment.student.first_name }} {{ localStudentAssessment.student.middle_name }} {{ localStudentAssessment.student.last_name }}
        </div>
        <div>
          <span class="font-light">Student ID:</span> {{ localStudentAssessment.student.id }}
        </div>
        <div>
          <span class="font-light">Address:</span> {{ localStudentAssessment.student.address }}
        </div>
        <div>
          <span class="font-light">Contact:</span> {{ localStudentAssessment.student.contact_number }}
        </div>
        <div>
          <span class="font-light">Year:</span> {{ academicYears?.data[0]?.academic_year }}
        </div>
        
      </div>
    </div>

    <div class="mb-6 border-b border-accent-content pb-4">
      <h3 class="text-lg font-semibold mb-2">
        Financial Summary
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-bold">
        <div class="p-3 rounded-md border border-accent-content">
          <span class="block font-normal label">Total Fees</span>
          <span class="text-xl text-green-500">₱ {{ parseFloat(localStudentAssessment.total_amount_due).toFixed(2) }}</span>
        </div>
        <div class=" p-3 rounded-md border border-accent-content">
          <span class="block font-normal label">Total Paid</span>
          <span class="text-xl text-blue-500">₱ {{ parseFloat(localStudentAssessment.total_paid).toFixed(2) }}</span>
        </div>
        <div class="p-3 rounded-md border border-accent-content">
          <span class="block  font-normal label">Balance</span>
          <span class="text-xl" :class="{ 'text-red-500': balance > 0, 'text-green-600': balance === 0 }">₱ {{ balance.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="border rounded-lg overflow-hidden border-accent-content">
        <h4 class="p-3 font-medium">
          Fees Breakdown
        </h4>
        <div class="overflow-x-auto overflow-y-auto max-h-[180px]">
          <table class="table w-full text-sm">
            <thead>
              <tr>
                <th class="p-3 font-medium text-left">
                  Fee Name
                </th>
                <th class="p-3 font-medium text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="fee in localStudentAssessment.fees"
                :key="fee.id"
              >
                <td class="p-3">
                  {{ fee.fee_name }}
                </td>
                <td class="p-3 text-right">
                  ₱{{ parseFloat(fee.amount).toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
