<script setup lang="ts">
const props = defineProps<{
  transactions: any;
}>();
const selectedTx = ref();
const selectedStatus = ref('');
const searchQuery = ref('');

const currentPage = ref(1);
const pageSize = ref(8);
const isOpen = ref(false);
const showDownloadModal = ref(false);

const filterType = ref<'all' | 'day' | 'week' | 'range'>('all');

const selectedDate = ref(new Date().toISOString().split('T')[0]);
const weekStart = ref('');
const weekEnd = ref('');
const rangeStart = ref('');
const rangeEnd = ref('');

// Helper functions
function isInWeek(txDate: string) {
  if (!weekStart.value || !weekEnd.value)
    return false;
  const date = new Date(txDate);
  return date >= new Date(weekStart.value) && date <= new Date(weekEnd.value);
}

function isInRange(txDate: string) {
  if (!rangeStart.value || !rangeEnd.value)
    return false;
  const date = new Date(txDate);
  return date >= new Date(rangeStart.value) && date <= new Date(rangeEnd.value);
}

function openModal(tx: any) {
  selectedTx.value = tx;
  isOpen.value = true;
}

const filteredTransactions = computed(() => {
  let items = [...props.transactions.data];
  items = items.filter(item => item.transaction.status === 'paid');

  // Status Filter
  if (selectedStatus.value) {
    items = items.filter(
      item => item.transaction.status === selectedStatus.value,
    );
  }

  // Search Filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    items = items.filter((item) => {
      const txId = String(item.transaction.transaction_id).toLowerCase();
      const studentId = String(item.student.id).toLowerCase();
      const studentName = `${item.student.first_name} ${item.student.middle_name || ''} ${item.student.last_name}`.toLowerCase();
      return txId.includes(q) || studentId.includes(q) || studentName.includes(q);
    });
  }

  // Date Filter
  items = items.filter((item) => {
    const txDate = item.transaction.createdAt;
    if (!txDate)
      return false;

    if (filterType.value === 'day') {
      return txDate.split('T')[0] === selectedDate.value;
    }
    else if (filterType.value === 'week') {
      return isInWeek(txDate);
    }
    else if (filterType.value === 'range') {
      return isInRange(txDate);
    }
    else if (filterType.value === 'all') {
      return true; // Show all transactions
    }
    return true;
  });

  return items;
});

const totalPages = computed(() =>
  Math.ceil(filteredTransactions.value.length / pageSize.value),
);

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredTransactions.value.slice(start, start + pageSize.value);
});

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}
</script>

<template>
  <div class="flex flex-col md:flex-row md:items-center md:justify-between my-4 gap-3">
    <h2 class="text-3xl">
      Transactions
    </h2>
    <div class="flex justify-end">
      <button class="btn btn-accent" @click="showDownloadModal = true">
        Generate Report
      </button>
    </div>
  </div>
  <div class="flex flex-col md:flex-row gap-2 justify-end">
    <div class="flex flex-col md:flex-row gap-2 ">
      <select v-model="filterType" class="select select-bordered w-44">
        <option value="all">
          Show All
        </option>
        <option value="day">
          Specific Day
        </option>
        <option value="week">
          Week
        </option>
        <option value="range">
          Custom Range
        </option>
      </select>

      <!-- Day Picker -->
      <div v-if="filterType === 'day'">
        <input
          v-model="selectedDate"
          type="date"
          class="input input-bordered"
        >
      </div>

      <!-- Week Picker -->
      <div v-if="filterType === 'week'" class="flex gap-2 items-center">
        <input
          v-model="weekStart"
          type="date"
          class="input input-bordered"
        >
        <span>to</span>
        <input
          v-model="weekEnd"
          type="date"
          class="input input-bordered"
        >
      </div>

      <!-- Range Picker -->
      <div v-if="filterType === 'range'" class="flex gap-2 items-center">
        <input
          v-model="rangeStart"
          type="date"
          class="input input-bordered"
        >
        <span>to</span>
        <input
          v-model="rangeEnd"
          type="date"
          class="input input-bordered"
        >
      </div>
    </div>

    <!-- Search -->
    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search by Transaction ID, Student ID, or Name..."
      class="input input-bordered w-96"
    >
  </div>
  <!-- Table -->
  <div class="overflow-x-auto">
    <table class="table w-full">
      <thead>
        <tr>
          <th>Transaction ID</th>
          <th>Student ID</th>
          <th>Student Name</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Date</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in paginatedTransactions" :key="index">
          <td>{{ item.transaction.transaction_id }}</td>
          <td>{{ item.student.id }}</td>
          <td>
            {{ item.student.first_name }}
            {{ item.student.middle_name }}
            {{ item.student.last_name }}
          </td>
          <td>₱ {{ item.transaction.total_amount }}</td>
          <td>
            <span
              :class="
                item.transaction.status === 'paid'
                  ? 'text-success'
                  : 'text-error'
              "
            >
              {{ item.transaction.status }}
            </span>
          </td>
          <td>
            {{
              new Date(item.transaction.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            }}
          </td>

          <td>
            <button
              class="btn btn-sm btn-success tooltip-success tooltip"
              data-tip="View"
              @click="openModal(item)"
            >
              <Icon name="solar:eye-linear" size="16" />
            </button>
          </td>
        </tr>

        <tr v-if="filteredTransactions.length === 0">
          <td colspan="7" class="text-center text-gray-500 py-4">
            No transactions found
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <!-- Pagination -->
  <div class="flex justify-center items-center gap-2 my-4">
    <button
      class="btn btn-sm"
      :disabled="currentPage === 1"
      @click="goToPage(currentPage - 1)"
    >
      Prev
    </button>

    <button
      v-for="page in totalPages"
      :key="page"
      class="btn btn-sm"
      :class="{ 'btn-accent': currentPage === page }"
      @click="goToPage(page)"
    >
      {{ page }}
    </button>

    <button
      class="btn btn-sm"
      :disabled="currentPage === totalPages"
      @click="goToPage(currentPage + 1)"
    >
      Next
    </button>

    <!-- dialog for transaction details -->
    <dialog :open="isOpen" class="modal">
      <div class="modal-box w-11/12 max-w-5xl bg-base-200 text-base-content rounded-xl shadow-xl">
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
              <li><span class="font-medium">ID:</span> {{ selectedTx?.student.id }}</li>
              <li><span class="font-medium">Name:</span> {{ selectedTx?.student.first_name }} {{ selectedTx?.student.middle_name }} {{ selectedTx?.student.last_name }}</li>
              <li><span class="font-medium">Address:</span> {{ selectedTx?.student.address }}</li>
            </ul>
          </div>

          <div class="bg-base-300 p-4 rounded-lg">
            <p class="text-sm text-gray-400 mb-2">
              Enrollment Information
            </p>
            <ul class="text-sm space-y-1">
              <li><span class="font-medium">Grade Level:</span> {{ selectedTx?.grade_level.grade_level_name }}</li>
              <li><span class="font-medium">Strand:</span> {{ selectedTx?.strand.strand_name }}</li>
              <li><span class="font-medium">Semester:</span> {{ selectedTx?.semester.semester }}</li>
              <li><span class="font-medium">Academic Year:</span> {{ selectedTx?.academic_year.academic_year }}</li>
            </ul>
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
            </dt>
            <dd class="truncate">
              {{ selectedTx?.transaction.transaction_id }}
            </dd>

            <dt class="font-medium">
              Status:
            </dt>
            <dd>
              <span class="badge badge-success badge-sm">
                {{ selectedTx?.transaction.status }}
              </span>
            </dd>

            <dt class="font-medium">
              Total Amount:
            </dt>
            <dd class="text-success font-semibold">
              ₱ {{ Number(selectedTx?.transaction.total_amount).toFixed(2) }}
            </dd>
          </dl>
        </div>

        <!-- Transaction Items Table -->
        <div class="mt-6">
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
                <tr
                  v-for="item in selectedTx?.transaction_items"
                  :key="item.id"
                >
                  <td>{{ item.item_type }}</td>
                  <td class="text-right">
                    ₱ {{ Number(item.amount).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-action flex justify-end gap-3 mt-6">
          <button class="btn btn-outline" @click="isOpen = false">
            Close
          </button>
        </div>
      </div>
    </dialog>
    <dialog :open="showDownloadModal" class="modal">
      <div class="modal-box">
        <DashboardDownloadReport @show-modal="showDownloadModal = false" />
      </div>
    </dialog>
  </div>
</template>
