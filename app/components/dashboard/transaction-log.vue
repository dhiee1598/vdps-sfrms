<script setup lang="ts">
const props = defineProps<{
  transactions: any;
}>();
const selectedTx = ref();
const selectedStatus = ref(''); // "" = All
const sortOrder = ref('latest'); // default = latest
const searchQuery = ref('');

const currentPage = ref(1);
const pageSize = ref(8); // items per page

const isOpen = ref(false);

function openModal(tx: any) {
  selectedTx.value = tx;
  isOpen.value = true;
}

const statuses = computed(() => {
  const set = new Set(
    props.transactions.data.map(
      (t: { transaction: { status: string } }) => t.transaction.status,
    ),
  );
  return Array.from(set);
});

const filteredTransactions = computed(() => {
  let items = [...props.transactions.data];

  if (selectedStatus.value) {
    items = items.filter(
      item => item.transaction.status === selectedStatus.value,
    );
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase();
    items = items.filter((item) => {
      const txId = String(item.transaction.transaction_id).toLowerCase();
      const studentId = String(item.student.id).toLowerCase();
      const studentName = `${item.student.first_name} ${item.student.middle_name || ''} ${item.student.last_name}`.toLowerCase();

      return (
        txId.includes(q)
        || studentId.includes(q)
        || studentName.includes(q)
      );
    });
  }

  items.sort((a, b) => {
    const dateA = new Date(a.transaction.createdAt).getTime();
    const dateB = new Date(b.transaction.createdAt).getTime();
    return sortOrder.value === 'latest' ? dateB - dateA : dateA - dateB;
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
    <h2 class="text-2xl">
      Transactions
    </h2>

    <div class="flex flex-col md:flex-row gap-2">
      <!-- Sort -->
      <select v-model="sortOrder" class="select select-bordered w-44">
        <option value="latest">
          Latest
        </option>
        <option value="oldest">
          Oldest
        </option>
      </select>

      <!-- Status Filter -->
      <select v-model="selectedStatus" class="select select-bordered w-44">
        <option value="">
          All
        </option>
        <option
          v-for="(status, index) in statuses"
          :key="index"
          :value="status"
        >
          {{ status }}
        </option>
      </select>

      <!-- Search -->
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by Transaction ID, Student ID, or Name..."
        class="input input-bordered w-96"
      >
    </div>
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
      :class="{ 'btn-primary': currentPage === page }"
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
          <!--
          <button class="btn btn-primary" @click="handlePrint">
            Print Receipt
          </button> -->
        </div>
      </div>
    </dialog>
  </div>
</template>
