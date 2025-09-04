<script setup lang="ts">
import { computed, ref } from 'vue';

const { data: students, pending, error, refresh } = await useFetch('/api/private/masterlist', { lazy: true });

// // --- Mock data ---
// const students = ref([
//   { id: 1, name: 'Juan Dela Cruz' },
//   { id: 2, name: 'Maria Santos' },
//   { id: 3, name: 'Jose Rizal' },
// ]);

// --- State ---
const searchQuery = ref('');
const selectedStudent = ref<null | { id: number; name: string }>(null);
const showConfirmation = ref(false);

// Payments
const quarters = ref([
  { name: '1st Quarter', selected: false, amount: 2000 },
  { name: '2nd Quarter', selected: false, amount: 2000 },
  { name: '3rd Quarter', selected: false, amount: 2000 },
  { name: '4th Quarter', selected: false, amount: 2000 },
]);

const sundries = ref([
  { name: 'ID', selected: false, amount: 100 },
  { name: 'Uniform', selected: false, amount: 500 },
  { name: 'Library Fee', selected: false, amount: 300 },
]);

// --- Computed ---
const allStudents = computed(() =>
  (students.value?.data ?? []).map((s: any) => ({
    id: s.student?.id,
    name: `${s.student?.first_name ?? ''} ${s.student?.middle_name ?? ''} ${s.student?.last_name ?? ''}`.trim(),
  })),
);

// --- Computed ---
const filteredStudents = computed(() => {
  if (!searchQuery.value)
    return [];
  return allStudents.value.filter(s =>
    s.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  );
});

const totalAmount = computed(() => {
  return (
    quarters.value.filter(q => q.selected).reduce((sum, q) => sum + q.amount, 0)
    + sundries.value.filter(s => s.selected).reduce((sum, s) => sum + s.amount, 0)
  );
});

// --- Actions ---
function selectStudent(student: { id: number; name: string }) {
  selectedStudent.value = student;
  searchQuery.value = '';
}

function submitTransaction() {
  if (totalAmount.value === 0) {
    return;
  }

  // Here you would normally call your API to save the transaction
  console.warn('Transaction created for', selectedStudent.value?.name, {
    quarters: quarters.value.filter(q => q.selected),
    sundries: sundries.value.filter(s => s.selected),
    total: totalAmount.value,
  });

  showConfirmation.value = true;

  // Reset after 3 seconds → go back to search
  setTimeout(() => {
    resetKiosk();
  }, 3000);
}

function resetKiosk() {
  selectedStudent.value = null;
  showConfirmation.value = false;

  // Reset all checkboxes
  quarters.value.forEach(q => (q.selected = false));
  sundries.value.forEach(s => (s.selected = false));
}
</script>

<template>
  <div class="min-h-screen bg-base-200 flex items-center justify-center p-6">
    <div class="card bg-base-100 shadow-xl w-full max-w-3xl p-6">
      <!-- Title -->
      <h1 class="text-2xl font-bold text-center mb-6">
        Student Kiosk
      </h1>

      <!-- Confirmation Screen -->
      <div v-if="showConfirmation" class="text-center py-10">
        <h2 class="text-xl font-semibold mb-4">
          Transaction Submitted!
        </h2>
        <p class="text-lg">
          Please proceed to the counter to complete the process.
        </p>
      </div>

      <!-- Search Student -->
      <div v-else-if="!selectedStudent">
        <Multiselect
          v-model="selectedStudent"
          :options="allStudents"
          :searchable="true"
          label="name"
          track-by="id"
          placeholder="Search by name..."
          :max-height="200"
          class="w-full "
        />
      </div>

      <!-- Payment Form -->
      <div v-else>
        <div class="flex flex-row gap-4">
          <h2 class="text-lg font-semibold mb-4 uppercase">
            Selected: {{ selectedStudent.name }}
          </h2>
          <h2 class="text-lg font-semibold mb-4">
            ID: {{ selectedStudent.id }}
          </h2>
        </div>

        <!-- Quarters -->
        <div class="mb-4">
          <h3 class="font-medium mb-2">
            Tuition Payments
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <label
              v-for="quarter in quarters"
              :key="quarter.name"
              class="flex items-center gap-2"
            >
              <input
                v-model="quarter.selected"
                type="checkbox"
                class="checkbox"
              >
              <span>{{ quarter.name }} - ₱{{ quarter.amount }}</span>
            </label>
          </div>
        </div>

        <!-- Sundries -->
        <div class="mb-4">
          <h3 class="font-medium mb-2">
            Sundries
          </h3>
          <div class="grid grid-cols-2 gap-2">
            <label
              v-for="item in sundries"
              :key="item.name"
              class="flex items-center gap-2"
            >
              <input
                v-model="item.selected"
                type="checkbox"
                class="checkbox"
              >
              <span>{{ item.name }} - ₱{{ item.amount }}</span>
            </label>
          </div>
        </div>

        <!-- Total -->
        <div class="flex justify-between items-center font-semibold text-lg mb-4">
          <span>Total:</span>
          <span>₱{{ totalAmount }}</span>
        </div>

        <!-- Actions -->
        <div class="flex justify-between">
          <button
            class="btn btn-ghost"
            type="button"
            @click="resetKiosk"
          >
            Back
          </button>
          <button
            class="btn btn-primary"
            type="button"
            @click="submitTransaction"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
