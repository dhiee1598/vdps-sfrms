<script setup lang="ts">
import { computed, ref } from 'vue';

// --- Mock data ---
const students = ref([
  { id: 1, name: 'Juan Dela Cruz' },
  { id: 2, name: 'Maria Santos' },
  { id: 3, name: 'Jose Rizal' },
]);

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
const filteredStudents = computed(() => {
  if (!searchQuery.value)
    return [];
  return students.value.filter(s =>
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
        <label class="form-control w-full mb-4">
          <span class="label-text">Search your name</span>
          <input
            v-model="searchQuery"
            type="text"
            class="input input-bordered w-full"
            placeholder="Type your name..."
          >
        </label>

        <ul v-if="filteredStudents.length" class="menu bg-base-100 rounded-box shadow-md">
          <li v-for="student in filteredStudents" :key="student.id">
            <button @click="selectStudent(student)">
              {{ student.name }}
            </button>
          </li>
        </ul>

        <p v-else-if="searchQuery" class="text-center text-sm text-gray-500">
          No results found
        </p>
      </div>

      <!-- Payment Form -->
      <div v-else>
        <h2 class="text-lg font-semibold mb-4">
          Selected: {{ selectedStudent.name }}
        </h2>

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
