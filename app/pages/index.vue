<script setup lang="ts">
import { StepformChoosePayment, StepformReviewPayment } from '#components';

import studentComputation from '~/utilities/student-computation';

const { data: assessment } = await useFetch('/api/private/assessment');
const { data: sundries } = await useFetch('/api/private/sundries');

const step = ref(1);
const selectedStudent = ref();
const studentdata = ref();
const formData = ref({
  assessment_id: '',
  student_id: '',
  total_amount: '',
  transaction_items: [],
});

const isSubmitting = ref(false);
async function handleStepClick() {
  console.warn('were passing data', formData.value);
  if (step.value < 4) {
    step.value++;
    if (step.value === 3) {
      formData.value.transaction_items = formData.value.transaction_items.filter(
        (item: any) => item.amount > 0,
      );
    }
  }
  else {
    console.warn('were passing data', formData.value);
    isSubmitting.value = true;
    // Step 4 reached — submit the form
    try {
      const response = await $fetch('/api/private/transactions', {
        method: 'POST',
        body: formData.value,
      });
      console.warn(formData.value);
      console.warn('Payment submitted successfully:', response);
      // Optionally reset or navigate
      step.value++;
    }
    catch (error) {
      console.error('Failed to submit payment:', error);
    }
    step.value = 1;
    formData.value = {
      assessment_id: '',
      student_id: '',
      total_amount: '',
      transaction_items: [],
    };
  }
}

watch(selectedStudent, (newVal) => {
  studentdata.value = studentComputation(newVal);
  formData.value.assessment_id = studentdata.value.selected_students.id;
  formData.value.student_id = studentdata.value.selected_students.student_id;
});
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-start bg-gray-800 p-8">
    <ul class="steps w-full max-w-3xl mb-8 justify-between">
      <li class="step" :class="[step >= 1 && 'step-primary']">
        Student Search
      </li>
      <li class="step" :class="[step >= 2 && 'step-primary']">
        Choose Payment Items
      </li>
      <li class="step" :class="[step >= 3 && 'step-primary']">
        Review & Confirm
      </li>
      <li class="step" :class="[step >= 4 && 'step-primary']">
        Proceed to Cashier
      </li>
    </ul>

    <div class="w-full max-w-3xl my-auto p-8 rounded-lg shadow-md flex flex-col gap-6 items-center">
      <div v-if="step === 1" class="w-full">
        <StepformSelectStudent
          :selected-student="selectedStudent"
          :all-student="assessment?.data"
          @update:selected-student="selectedStudent = $event"
        />
      </div>

      <div v-if="step === 2" class="w-full text-center">
        <StepformChoosePayment
          v-model:datas="studentdata"
          v-model:form-data="formData"
          :sundries="sundries?.data"
        />
      </div>

      <div v-if="step === 3" class="w-full">
        <StepformReviewPayment v-model:datas="studentdata" :form-data="formData" />
      </div>

      <div v-if="step === 4" class="text-center text-lg font-medium">
        Click Submit and proceed to Cashier. Thank you for using our services.
      </div>

      <div class="w-full items-center flex justify-center gap-3">
        <button
          v-if="step > 1"
          class="btn w-full sm:w-1/3 mt-4"
          @click="step--"
        >
          Back
        </button>
        <button
          class="btn btn-accent w-full sm:w-1/3 mt-4"
          :disabled="isSubmitting && step === 4"
          @click="handleStepClick"
        >
          <span v-if="step === 4">
            {{ isSubmitting ? 'Submitting...' : 'Submit' }}
          </span>
          <span v-else>
            Next
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
