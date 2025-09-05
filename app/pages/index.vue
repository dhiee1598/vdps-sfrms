<script setup lang="ts">
import studentComputation from '~/utilities/student-computation';

const { data: assessment } = await useFetch('/api/private/assessment');

const step = ref(1);
const isLoading = ref(false);
const selectedStudent = ref();
const studentdata = ref();

function handleStepClick() {
  if (step.value === 2 || !selectedStudent.value)
    return;

  if (step.value < 4)
    step.value++;
}

watch(selectedStudent, (newVal) => {
  studentdata.value = studentComputation(newVal);
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

      <div v-if="step === 2" class="text-center w-full text-lg font-medium">
        <div v-if="isLoading">
          <span class="loading loading-ring loading-xl" />
        </div>
        <div v-else class="w-full">
          <StepformChoosePayment v-model:datas="studentdata" />
        </div>
      </div>

      <div v-if="step === 3" class="text-center text-lg font-medium">
        THIS IS STEP 3
      </div>

      <div v-if="step === 4" class="text-center text-lg font-medium">
        THIS IS STEP 4
      </div>

      <div class="w-full items-center flex justify-center gap-3">
        <button
          v-if="step > 1"
          class="btn w-full sm:w-1/3 mt-4"
          @click="step--"
        >
          Back
        </button>
        <button class="btn btn-accent w-full sm:w-1/3 mt-4" @click="handleStepClick">
          {{ step === 4 ? 'Submit' : 'Next' }}
        </button>
      </div>
    </div>
  </div>
</template>
