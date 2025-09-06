<script setup lang="ts">
const { data: transactions } = await useFetch('/api/private/transactions');

const isOpen = ref(false);
const selectedItem = ref();
const searchQuery = ref('');
const selectedGrade = ref('');
const selectedStrand = ref('');

const currentPage = ref(1);
const itemsPerPage = 10; // adjust as needed

// Extract unique grade levels & strands for dropdown filters
const gradeLevels = computed(() => {
  const set = new Set(transactions.value?.data.map(t => t.grade_level.grade_level_name));
  return Array.from(set);
});
const strands = computed(() => {
  const set = new Set(transactions.value?.data.map(t => t.strand.strand_name));
  return Array.from(set);
});

// Filtering logic
const filteredTransactions = computed(() => {
  return transactions.value?.data
    .filter(t => t.transaction.status === 'paid')
    .filter((t) => {
      const query = searchQuery.value.toLowerCase();
      const fullName = `${t.student.first_name} ${t.student.middle_name ?? ''} ${t.student.last_name}`.toLowerCase();
      return (
        t.transaction.transaction_id.toLowerCase().includes(query)
        || fullName.includes(query)
      );
    })
    .filter(t => !selectedGrade.value || t.grade_level.grade_level_name === selectedGrade.value)
    .filter(t => !selectedStrand.value || t.strand.strand_name === selectedStrand.value);
});

// Paginated results
const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredTransactions.value?.slice(start, start + itemsPerPage) || [];
});

// Total pages
const totalPages = computed(() => {
  return Math.ceil((filteredTransactions.value?.length || 0) / itemsPerPage);
});

// Reset page when filters/search change
watch([searchQuery, selectedGrade, selectedStrand], () => {
  currentPage.value = 1;
});

function openModal(item: any) {
  isOpen.value = true;
  selectedItem.value = item;
}
</script>

<template>
  <div class="p-2 w-full">
    <!-- Header & Search/Filters -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between my-4 gap-3">
      <h2 class="text-3xl">
        Completed Transactions
      </h2>

      <div class="flex flex-col md:flex-row gap-2">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by Transaction ID or Student Name..."
          class="input input-bordered w-72"
        >

        <select v-model="selectedGrade" class="select select-bordered w-44">
          <option value="">
            All Grades
          </option>
          <option
            v-for="grade in gradeLevels"
            :key="grade"
            :value="grade"
          >
            {{ grade }}
          </option>
        </select>

        <select v-model="selectedStrand" class="select select-bordered w-44">
          <option value="">
            All Strands
          </option>
          <option
            v-for="strand in strands"
            :key="strand"
            :value="strand"
          >
            {{ strand }}
          </option>
        </select>
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
            <th>Grade</th>
            <th>Strand</th>
            <th>Status</th>
            <th>Amount</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in paginatedTransactions" :key="item.transaction.transaction_id">
            <td>{{ item.transaction.transaction_id }}</td>
            <td>{{ item.student.id }}</td>
            <td>{{ item.student.first_name }} {{ item.student.middle_name }} {{ item.student.last_name }}</td>
            <td>{{ item.grade_level.grade_level_name }}</td>
            <td>{{ item.strand.strand_name }}</td>
            <td>{{ item.transaction.status }}</td>
            <td>₱ {{ Number(item.transaction.total_amount).toFixed(2) }}</td>
            <td>
              <button class="btn btn-sm btn-primary" @click="openModal(item)">
                View
              </button>
            </td>
          </tr>
          <tr v-if="paginatedTransactions.length === 0">
            <td colspan="8" class="text-center text-gray-500 py-4">
              No transactions found
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination Controls -->

    <div class="flex justify-center mt-4 space-x-2">
      <button
        class="btn btn-sm"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        Prev
      </button>

      <template v-for="page in totalPages" :key="page">
        <button
          v-if="page > 0"
          class="btn btn-sm"
          :class="{ 'btn-active': currentPage === page }"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
        <span v-else class="px-2">…</span>
      </template>

      <button
        class="btn btn-sm"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        Next
      </button>
    </div>
    <dialog :open="isOpen" class="modal">
      <div class="modal-box w-11/12 max-w-5xl bg-base-200 text-base-content rounded-xl shadow-xl">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-base-300 pb-3">
          <h3 class="text-xl font-semibold flex items-center gap-2">
            <Icon
              name="mdi:file-document-outline"
              size="22"
              class="text-primary"
            />
            Transaction Summary
          </h3>
          <button class="btn btn-sm btn-ghost" @click="isOpen = false">
            ✕
          </button>
        </div>

        <!-- Student & Enrollment Details -->
        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-base-300 p-4 rounded-lg">
            <p class="text-sm text-gray-400 mb-2">
              Student Information
            </p>
            <ul class="text-sm space-y-1">
              <li><span class="font-medium">ID:</span> {{ selectedItem?.student.id }}</li>
              <li><span class="font-medium">Name:</span> {{ selectedItem?.student.first_name }} {{ selectedItem?.student.middle_name }} {{ selectedItem?.student.last_name }}</li>
              <li><span class="font-medium">Address:</span> {{ selectedItem?.student.address }}</li>
            </ul>
          </div>

          <div class="bg-base-300 p-4 rounded-lg">
            <p class="text-sm text-gray-400 mb-2">
              Enrollment Information
            </p>
            <ul class="text-sm space-y-1">
              <li><span class="font-medium">Grade Level:</span> {{ selectedItem?.grade_level.grade_level_name }}</li>
              <li><span class="font-medium">Strand:</span> {{ selectedItem?.strand.strand_name }}</li>
              <li><span class="font-medium">Semester:</span> {{ selectedItem?.semester.semester }}</li>
              <li><span class="font-medium">Academic Year:</span> {{ selectedItem?.academic_year.academic_year }}</li>
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
              {{ selectedItem?.transaction.transaction_id }}
            </dd>

            <dt class="font-medium">
              Status:
            </dt>
            <dd>
              <span class="badge badge-warning badge-sm">
                {{ selectedItem?.transaction.status }}
              </span>
            </dd>

            <dt class="font-medium">
              Total Amount:
            </dt>
            <dd class="text-primary font-semibold">
              ₱ {{ Number(selectedItem?.transaction.total_amount).toFixed(2) }}
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
                  v-for="item in selectedItem?.transaction_items"
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
  </div>
</template>
