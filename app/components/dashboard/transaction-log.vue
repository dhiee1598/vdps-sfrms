<script setup lang="ts">
const props = defineProps<{
  transactions: any;
}>();

const selectedStatus = ref(''); // "" = All
const sortOrder = ref('latest'); // default = latest
const searchQuery = ref('');

const currentPage = ref(1);
const pageSize = ref(8); // items per page

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
              class="btn btn-sm btn-success tooltip"
              data-tip="View"
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
  </div>
</template>
