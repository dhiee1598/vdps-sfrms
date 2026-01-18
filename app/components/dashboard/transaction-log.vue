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
  if (!props.transactions?.data) return [];

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
    // Prefer date_paid, fallback to createdAt
    const rawDate = item.transaction.date_paid || item.transaction.createdAt;
    if (!rawDate) return false;

    // Convert to simple YYYY-MM-DD for day comparison
    const dateObj = new Date(rawDate);
    const dateStr = dateObj.toISOString().split('T')[0];

    if (filterType.value === 'day') {
      return dateStr === selectedDate.value;
    }
    else if (filterType.value === 'week') {
      return isInWeek(rawDate);
    }
    else if (filterType.value === 'range') {
      return isInRange(rawDate);
    }
    else if (filterType.value === 'all') {
      return true; // Show all transactions
    }
    return true;
  });

  // Sort by Date Descending
  return items.sort((a, b) => {
    const dateA = new Date(a.transaction.date_paid || a.transaction.createdAt).getTime();
    const dateB = new Date(b.transaction.date_paid || b.transaction.createdAt).getTime();
    return dateB - dateA;
  });
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredTransactions.value.length / pageSize.value)),
);

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredTransactions.value.slice(start, start + pageSize.value);
});

// --- NEW: Smart Pagination Logic ---
const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 1; // Number of pages to show around current page

  // If total pages are 7 or less, show all
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];
  const left = current - delta;
  const right = current + delta;

  // Always show first page
  pages.push(1);

  // Logic for '...' or specific pages on the left
  if (left > 2) {
    pages.push('...');
  } else if (left === 2) {
    pages.push(2);
  }

  // Middle pages
  const start = Math.max(2, left);
  const end = Math.min(total - 1, right);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  // Logic for '...' or specific pages on the right
  if (right < total - 1) {
    pages.push('...');
  } else if (right === total - 1) {
    pages.push(total - 1);
  }

  // Always show last page
  if (total > 1) {
    pages.push(total);
  }

  return pages;
});

function goToPage(page: number | string) {
  if (typeof page === 'number' && page >= 1 && page <= totalPages.value) {
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

      <div v-if="filterType === 'day'">
        <input
          v-model="selectedDate"
          type="date"
          class="input input-bordered"
        >
      </div>

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

    <input
      v-model="searchQuery"
      type="text"
      placeholder="Search by Transaction ID, Student ID, or Name..."
      class="input input-bordered w-96"
    >
  </div>
  <div class="overflow-x-auto min-h-[400px]">
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
          <td class="font-mono text-xs">{{ item.transaction.transaction_id.slice(0, 15) }}...</td>
          <td>{{ item.student.id }}</td>
          <td>
            {{ item.student.first_name }}
            {{ item.student.middle_name }}
            {{ item.student.last_name }}
          </td>
          <td>₱ {{ Number(item.transaction.total_amount).toFixed(2) }}</td>
          <td>
            <span
              :class="
                item.transaction.status === 'paid'
                  ? 'text-success uppercase font-bold text-xs'
                  : 'text-error uppercase font-bold text-xs'
              "
            >
              {{ item.transaction.status }}
            </span>
          </td>
          <td>
            {{
              new Date(item.transaction.date_paid || item.transaction.createdAt).toLocaleDateString("en-US", {
                timeZone: "UTC",
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
  
  <div class="flex justify-center items-center gap-2 my-4">
    <button
      class="btn btn-sm"
      :disabled="currentPage === 1"
      @click="goToPage(currentPage - 1)"
    >
      Prev
    </button>

    <template v-for="(page, index) in visiblePages" :key="index">
      <button
        v-if="page !== '...'"
        class="btn btn-sm"
        :class="{ 'btn-accent': currentPage === page }"
        @click="goToPage(Number(page))"
      >
        {{ page }}
      </button>
      <span v-else class="btn btn-sm btn-disabled bg-transparent border-none text-gray-500">...</span>
    </template>

    <button
      class="btn btn-sm"
      :disabled="currentPage === totalPages"
      @click="goToPage(currentPage + 1)"
    >
      Next
    </button>
  </div>

  <dialog :open="isOpen" class="modal">
    <div class="modal-box w-11/12 max-w-5xl bg-base-200 text-base-content rounded-xl shadow-xl">
      <div class="flex items-center justify-between border-b border-base-300 pb-3">
        <h3 class="text-xl font-semibold flex items-center gap-2">
          <Icon
            name="solar:document-add-linear"
            size="22"
          />
          Transaction Summary
        </h3>
      </div>

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
            <li><span class="font-medium">Grade Level:</span> {{ selectedTx?.grade_level?.grade_level_name }}</li>
            <li><span class="font-medium">Strand:</span> {{ selectedTx?.strand?.strand_name || 'N/A' }}</li>
            
            <li><span class="font-medium">Academic Year:</span> {{ selectedTx?.academic_year?.academic_year }}</li>
          </ul>
        </div>
      </div>

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
            Date Paid:
          </dt>
          <dd>
             {{ new Date(selectedTx?.transaction.date_paid || selectedTx?.transaction.createdAt).toLocaleDateString() }}
          </dd>

          <dt class="font-medium">
            Total Amount:
          </dt>
          <dd class="text-success font-semibold">
            ₱ {{ Number(selectedTx?.transaction.total_amount).toFixed(2) }}
          </dd>
        </dl>
      </div>

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
</template>
