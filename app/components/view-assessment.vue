<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  data: any;
}>();

const emit = defineEmits<{
  (e: 'showModal'): void;
}>();

const { data: academicYears } = useFetch('/api/private/academic-years?activeYear=true', {lazy: true});

const localStudentAssessment = ref(props.data);

watch(() => props.data, (newVal) => {
  localStudentAssessment.value = newVal;
});

// 1. Calculate Gross Subtotal
const feesSubtotal = computed(() => {
  if (!localStudentAssessment.value?.fees?.length) {
    return 0;
  }
  return localStudentAssessment.value.fees.reduce((sum: number, fee: any) => sum + Number(fee.amount), 0);
});

// 2. Calculate Discount Amount
const discountAmount = computed(() => {
  if (!localStudentAssessment.value) return 0;
  const due = Number(localStudentAssessment.value.total_amount_due);
  const sub = feesSubtotal.value;
  return Math.max(0, sub - due);
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
        class="btn btn-error btn-sm btn-circle"
        @click="emit('showModal')"
      >
        <Icon name="solar:close-circle-bold" size="24" />
      </button>
    </div>

    <div class="mb-6 border-b border-base-300 pb-4">
      <div class="flex justify-between items-start mb-4">
        <h3 class="text-xl font-medium">
          Student Information
        </h3>
        <div class="flex gap-2">
            <div v-if="localStudentAssessment.is_esc_grant" class="badge badge-primary gap-1 p-3">
                <Icon name="solar:verified-check-bold" /> ESC Grant Applied
            </div>
            <div v-if="localStudentAssessment.is_cash_discount" class="badge badge-secondary gap-1 p-3">
                <Icon name="solar:tag-price-bold" /> Cash Discount (4%)
            </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span class="font-light opacity-70">Name:</span> 
          <span class="font-medium ml-1">{{ localStudentAssessment.student.last_name }}, {{ localStudentAssessment.student.first_name }} {{ localStudentAssessment.student.middle_name }}</span>
        </div>
        <div>
          <span class="font-light opacity-70">Student ID:</span> 
          <span class="font-medium ml-1">{{ localStudentAssessment.student.id }}</span>
        </div>
        <div>
          <span class="font-light opacity-70">Address:</span> 
          <span class="font-medium ml-1">{{ localStudentAssessment.student.address }}</span>
        </div>
        <div>
          <span class="font-light opacity-70">Contact:</span> 
          <span class="font-medium ml-1">{{ localStudentAssessment.student.contact_number }}</span>
        </div>
        <div>
          <span class="font-light opacity-70">Academic Year:</span> 
          <span class="font-medium ml-1">{{ academicYears?.data[0]?.academic_year }}</span>
        </div>
      </div>
    </div>

    <div class="mb-6 border-b border-base-300 pb-4">
      <h3 class="text-lg font-semibold mb-3">
        Financial Summary
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        
        <div class="stats shadow border border-base-200">
            <div class="stat px-4">
                <div class="stat-title text-xs uppercase font-bold opacity-60">Total Tuition</div>
                <div class="stat-value text-success text-xl">₱ {{ parseFloat(localStudentAssessment.total_amount_due).toFixed(2) }}</div>
                <div v-if="discountAmount > 0" class="stat-desc text-warning text-xs">
                    (Net of Discounts)
                </div>
            </div>
        </div>

      </div>
    </div>

    <div class="grid grid-cols-1">
      <div class="border border-base-300 rounded-lg overflow-hidden">
        <h4 class="p-3 font-medium bg-base-200">
          Fees Breakdown
        </h4>
        <div class="overflow-x-auto max-h-[300px]">
          <table class="table w-full text-sm">
            <thead class="sticky top-0 bg-base-100 z-10">
              <tr>
                <th class="p-3 font-bold text-left">Fee Name</th>
                <th class="p-3 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="!localStudentAssessment.fees || localStudentAssessment.fees.length === 0">
                  <td colspan="2" class="text-center py-4 opacity-50">No fees details available</td>
              </tr>
              <tr
                v-for="fee in localStudentAssessment.fees"
                :key="fee.id"
                class="hover"
              >
                <td class="p-3">{{ fee.fee_name }}</td>
                <td class="p-3 text-right">₱ {{ parseFloat(fee.amount).toFixed(2) }}</td>
              </tr>
            </tbody>
            
            <tfoot class="bg-base-100 font-bold border-t-2 border-base-200">
                <tr>
                    <td class="p-3 text-right">Subtotal (Gross):</td>
                    <td class="p-3 text-right">₱ {{ feesSubtotal.toFixed(2) }}</td>
                </tr>
                
                <tr v-if="discountAmount > 0" class="text-error">
                    <td class="p-3 text-right flex items-center justify-end gap-2">
                        <span>Less: Discounts / ESC Grant</span>
                    </td>
                    <td class="p-3 text-right">- ₱ {{ discountAmount.toFixed(2) }}</td>
                </tr>

                <tr class="bg-base-200 text-lg">
                    <td class="p-3 text-right">Net Amount Due:</td>
                    <td class="p-3 text-right text-success">₱ {{ parseFloat(localStudentAssessment.total_amount_due).toFixed(2) }}</td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
