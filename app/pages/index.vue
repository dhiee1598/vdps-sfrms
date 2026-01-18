<script setup lang="ts">
import { v4 as uuidv4 } from 'uuid';
import { socket } from '~/components/socket';

useHead({
  title: 'Student Portal',
});

// 2. STATE MANAGEMENT
const isMounted = ref(false);

const step = ref(1);
const selectedStudent = ref();
const studentdata = ref();
const formData = ref({
  transaction_id: '',
  assessment_id: '',
  student_id: '',
  total_amount: 0,
  transaction_items: [],
});
const isConnected = ref(false);
const transport = ref('N/A');

const isSubmitting = ref(false);

function resetForm() {
  step.value = 1;
  selectedStudent.value = null;
  studentdata.value = null;
  formData.value = {
    transaction_id: '',
    assessment_id: '',
    student_id: '',
    total_amount: 0,
    transaction_items: [],
  };
}

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
            resetForm();
          }, 5000);
        }
      }
      catch (error) {
        console.error('Failed to submit payment:', error);
        isSubmitting.value = false;
      }
    }
  }
}

function onConnect() {
  isConnected.value = true;
  transport.value = socket.io.engine.transport.name;

  socket.io.engine.on('upgrade', (rawTransport: any) => {
    transport.value = rawTransport.name;
  });
}

function onDisconnect() {
  isConnected.value = false;
  transport.value = 'N/A';
}

onBeforeUnmount(() => {
  socket.off('connect', onConnect);
  socket.off('disconnect', onDisconnect);
});

onMounted(() => {
  isMounted.value = true;

  if (socket.connected) {
    onConnect();
  }

  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);

  socket.on('newData', async (message: any) => {
    console.warn(message);
    // Data refresh is now handled within components or on new interactions
  });
});

watch(selectedStudent, (newVal) => {
  if (newVal) {
    studentdata.value = studentComputation(newVal);
    formData.value.assessment_id = studentdata.value.selected_students.id;
    formData.value.transaction_id = uuidv4();
    formData.value.student_id = studentdata.value.selected_students.student_id;
  } else {
    studentdata.value = null;
    formData.value.assessment_id = '';
    formData.value.student_id = '';
    formData.value.transaction_items = [];
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-col items-center text-center justify-start p-4">
    <ul class="steps w-full max-w-3xl mb-8 justify-between">
      <li class="step text-sm md:text-md" :class="[step >= 1 && 'step-accent font-semibold']">
        Search Student
      </li>
      <li class="step text-sm md:text-md" :class="[step >= 2 && 'step-accent font-semibold']">
        Choose Payment Items
      </li>
      <li class="step text-sm md:text-md" :class="[step >= 3 && 'step-accent font-semibold']">
        Review & Confirm
      </li>
      <li class="step text-sm md:text-md" :class="[step >= 4 && 'step-accent font-semibold']">
        Proceed to Cashier
      </li>
    </ul>

    <div class="w-full max-w-3xl my-auto p-2 md:p-8 rounded-lg shadow-md flex flex-col gap-6 items-center">
      <div v-if="step === 1" class="w-full relative">
        <StepformSelectStudent
          :selected-student="selectedStudent"
          @update:selected-student="selectedStudent = $event"
        />
      </div>

      <div v-if="step === 2" class="w-full">
        <StepformChoosePayment
          v-model:datas="studentdata"
          v-model:form-data="formData"
        />
      </div>

      <div v-if="step === 3" class="w-full">
        <StepformReviewPayment
          v-model:datas="studentdata"
          :form-data="formData"
        />
      </div>

      <div v-if="step === 4" class="w-full">
        <div v-if="isSubmitting" class="flex justify-center">
          <div class="flex flex-col items-center justify-center p-6 w-full max-w-sm">
            <span class="loading loading-spinner loading-xl" />
            <p class="text-xl font-semibold py-4 label">
              Processing Payment...
            </p>
          </div>
        </div>
        <div v-else class="flex justify-center">
          <div class="p-2 text-center">
            <div class="mb-4">
              <Icon
                name="solar:check-circle-linear"
                size="65"
                class="text-green-500"
              />
            </div>
            <h2 class="text-xl font-bold mb-2">
              Payment Submitted
            </h2>
            <p class="mb-6 mt-5 text-sm">
              Please proceed to the cashier to complete the transaction. <br>
              Thank you for your payment.
            </p>
            <div class="animate-pulse text-sm label">
              Redirecting back in 5 seconds
            </div>
          </div>
        </div>
      </div>

      <div v-if="step !== 4" class="w-full flex-col items-center flex justify-center gap-2">
        <button
          v-if="step > 1"
          class="btn w-full max-w-md mt-4"
          @click="
            step--;
            if (step === 1) {
              selectedStudent = null;
              studentdata = null;
              formData.assessment_id = '';
              formData.student_id = '';
              formData.transaction_items = [];
            }
          "
        >
          Back
        </button>
        
        <button
          class="btn btn-accent w-full max-w-md"
          :disabled="!isMounted
            || (step === 1 && !selectedStudent)
            || (step === 2 && formData.total_amount === 0)"
          @click="handleStepClick"
        >
          {{ step === 3 ? 'Confirm' : 'Next' }}
        </button>
      </div>
    </div>
  </div>
</template>
