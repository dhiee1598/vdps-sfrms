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
  total_amount: 0,
  transaction_items: [],
});

const isSubmitting = ref(false);

async function handleStepClick() {
  if (step.value < 4) {
    step.value++;
    if (step.value === 3) {
      formData.value.transaction_items = formData.value.transaction_items.filter(
        (item: any) => item.amount > 0,
      );
    }

    if (step.value === 4) {
      isSubmitting.value = true;

      try {
        const { success } = await $fetch('/api/private/transactions', {
          method: 'POST',
          body: formData.value,
        });

        if (success) {
          isSubmitting.value = false;
          setTimeout(() => {
            step.value = 1;
            selectedStudent.value = null;
            studentdata.value = null;
            formData.value = {
              assessment_id: '',
              student_id: '',
              total_amount: 0,
              transaction_items: [],
            };
          }, 3000);
        }
        else {
          isSubmitting.value = false;
          step.value--;
        }
      }
      catch (error) {
        console.error('Failed to submit payment:', error);
        isSubmitting.value = false;
      }
    }
  }
}

watch(selectedStudent, (newVal) => {
  if (newVal) {
    studentdata.value = studentComputation(newVal);
    formData.value.assessment_id = studentdata.value.selected_students.id;
    formData.value.student_id = studentdata.value.selected_students.student_id;
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-start bg-gray-800 p-8">
    <ul class="steps w-full max-w-3xl mb-8 justify-between">
      <li class="step" :class="[step >= 1 && 'step-primary']">
        Search Student
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
        <StepformReviewPayment
          v-model:datas="studentdata"
          :form-data="formData"
        />
      </div>

      <div v-if="step === 4" class="text-center text-lg font-medium">
        <div v-if="isSubmitting" class="w-full flex justify-center">
          <div class="flex flex-col items-center justify-center p-6 w-full max-w-sm">
            <span class="loading loading-spinner loading-xl" />
            <p class="text-xl font-semibold py-4 label">
              Processing Payment...
            </p>
          </div>
        </div>
        <div v-else class="flex justify-center">
          <div class="w-full max-w-md p-6 text-center">
            <div class="flex justify-center mb-4">
              <Icon
                name="solar:check-circle-linear"
                size="65"
                class="text-green-500"
              />
            </div>
            <h2 class="text-xl font-bold mb-2">
              Payment Submitted
            </h2>
            <p class="mb-6 mt-5 text-sm label">
              Please proceed to the cashier to complete the transaction. <br>
              Thank you for your payment.
            </p>
            <div class="animate-pulse text-sm label">
              Redirecting back in 3 seconds...
            </div>
          </div>
        </div>
      </div>

      <div v-if="step !== 4" class="w-full items-center flex justify-center gap-3">
        <button
          v-if="step > 1"
          class="btn w-full sm:w-1/3 mt-4"
          @click="
            step--;
            if (step === 1) {
              selectedStudent = null;
              studentdata = null;
              formData.assessment_id = '';
              formData.student_id = '';
            }
          "
        >
          Back
        </button>
        <button
          class="btn btn-accent w-full sm:w-1/3 mt-4"
          :disabled="(step === 1 && formData.student_id === '')
            || (step === 2 && formData.total_amount === 0)"
          @click="handleStepClick"
        >
          {{ step === 3 ? 'Confirm' : 'Next' }}
        </button>
      </div>
    </div>
  </div>
</template>
