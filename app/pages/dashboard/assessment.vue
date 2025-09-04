<script setup lang="ts">
import type { Assessment } from '~~/server/lib/zod-schema';

const isEditing = ref(false);
const showFormModal = ref(false);

const assessmentData = ref<Assessment>({
  enrollment_id: null,
  students: null,
  fees: [],
  total_fees: 0,
});

function openAddStudentAssessment() {
  isEditing.value = false;
  showFormModal.value = true;
  assessmentData.value = {
    enrollment_id: null,
    students: null,
    fees: [],
    total_fees: 0,
  };
}

async function handleFormSubmit() {
  console.warn(assessmentData.value);
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
  </div>
</template>
