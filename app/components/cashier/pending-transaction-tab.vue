<script setup lang="ts">
import type { FetchError } from 'ofetch';

import { ref } from 'vue';
import { useVueToPrint } from 'vue-to-print';

import { socket } from '../socket';

const { data: transactions, refresh } = await useFetch('/api/private/transactions');

const isConnected = ref(false);
const transport = ref('N/A');
const isOpen = ref(false);
const selectedItem = ref();
const searchQuery = ref('');
const selectedGrade = ref('');
const selectedStrand = ref('');
const isSubmitting = ref(false);
const showPrintModal = ref(false);
const componentRef = ref();
const { isMessage, isError, responseMessage, showMessage } = useNotification();

const currentPage = ref(1);
const itemsPerPage = 10;

function onConnect() {
  isConnected.value = true;
  transport.value = socket.io.engine.transport.name;

  socket.io.engine.on('upgrade', (rawTransport) => {
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

const gradeLevels = computed(() => {
  const set = new Set(transactions.value?.data.map(t => t.grade_level.grade_level_name));
  return Array.from(set);
});
const strands = computed(() => {
  const set = new Set(transactions.value?.data.map(t => t.strand.strand_name));
  return Array.from(set);
});

const filteredTransactions = computed(() => {
  return transactions.value?.data
    .filter(t => t.transaction.status === 'pending')
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

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredTransactions.value?.slice(start, start + itemsPerPage) || [];
});

const totalPages = computed(() => {
  return Math.ceil((filteredTransactions.value?.length || 0) / itemsPerPage);
});

function openModal(item: any) {
  isOpen.value = true;
  selectedItem.value = item;
  console.warn(item);
}

const { handlePrint } = useVueToPrint({
  content: () => componentRef.value,
  documentTitle: 'Transaction-Receipt',
  onAfterPrint: () => {
    showPrintModal.value = false;
    selectedItem.value = null;
  },
});
onMounted(() => {
  if (socket.connected) {
    onConnect();
  }

  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);

  socket.on('newPayment', async (payment) => {
    console.warn('New payment received:', payment);
    await refresh();
  });
});

async function handleSubmit() {
  if (!selectedItem.value)
    return;

  isSubmitting.value = true;
  try {
    let response;

    if (selectedItem.value) {
      response = await $fetch(`/api/private/transactions/${selectedItem.value.transaction.transaction_id}`, {
        method: 'PUT',
        body: { status: 'paid' },
      });
      isOpen.value = false;
      showPrintModal.value = true;
      handlePrint();

      showMessage(response.message, false);
      await refresh();
    }
  }
  catch (e) {
    const error = e as FetchError;
    showMessage(error.data.message || 'An unexpected error occurred.', true);
  }
  finally {
    isSubmitting.value = false;
  }
}

watch([searchQuery, selectedGrade, selectedStrand], () => {
  currentPage.value = 1;
});
</script>

<template>
  <div class="p-2 w-full">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between my-4 gap-3">
      <h2 class="text-3xl">
        Completed Transactions
      </h2>

      <div class="flex flex-col md:flex-row gap-2">
        <!-- Grade Filter -->
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

        <!-- Strand Filter -->
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
        <!-- Search -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by Transaction ID or Student Name..."
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
          <tr v-if="paginatedTransactions?.length === 0">
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
            Cancel
          </button>
          <button class="btn btn-primary" @click="handleSubmit">
            Mark as Paid
          </button>
        </div>
      </div>
    </dialog>
    <!-- ✅ PRINTABLE RECEIPT -->
    <div ref="componentRef" class="print-area mx-auto my-6 max-w-md bg-white text-black p-6 rounded-lg shadow-md block md:hidden lg:hidden">
      <!-- School Header -->
      <div class="text-center border-b pb-4 mb-4">
        <h2 class="text-lg font-bold">
          Virgen Del Pilar School Rodriguez, Inc.
        </h2>
        <p class="text-sm">
          ADDRESS
        </p>
        <p class="text-sm">
          Official Receipt
        </p>
      </div>

      <!-- Student Information -->
      <div class="mb-4 text-sm">
        <p><span class="font-medium">Student ID:</span> {{ selectedItem?.student.id }}</p>
        <p><span class="font-medium">Name:</span> {{ selectedItem?.student.first_name }} {{ selectedItem?.student.middle_name }} {{ selectedItem?.student.last_name }}</p>
        <p><span class="font-medium">Address:</span> {{ selectedItem?.student.address }}</p>
      </div>

      <!-- Enrollment Information -->
      <div class="mb-4 text-sm">
        <p><span class="font-medium">Grade Level:</span> {{ selectedItem?.grade_level.grade_level_name }}</p>
        <p><span class="font-medium">Strand:</span> {{ selectedItem?.strand.strand_name }}</p>
        <p><span class="font-medium">Semester:</span> {{ selectedItem?.semester.semester }}</p>
        <p><span class="font-medium">Academic Year:</span> {{ selectedItem?.academic_year.academic_year }}</p>
      </div>

      <!-- Transaction Details -->
      <div class="mb-4 text-sm">
        <p><span class="font-medium">Transaction ID:</span> {{ selectedItem?.transaction.transaction_id }}</p>
        <p><span class="font-medium">Status:</span> <span class="text-green-600 font-semibold">paid</span></p>
        <p><span class="font-medium">Total Amount:</span> ₱ {{ Number(selectedItem?.transaction.total_amount).toFixed(2) }}</p>
      </div>

      <!-- Payment Breakdown -->
      <div class="mb-4">
        <h3 class="font-semibold text-sm mb-2">
          Payment Breakdown
        </h3>
        <table class="w-full text-sm border-t border-b">
          <thead>
            <tr class="text-left">
              <th class="py-1">
                Payment Type
              </th>
              <th class="py-1 text-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in selectedItem?.transaction_items" :key="item.id">
              <td class="py-1">
                {{ item.item_type }}
              </td>
              <td class="py-1 text-right">
                ₱ {{ Number(item.amount).toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div class="mt-6 text-sm">
        <p><span class="font-medium">Date:</span> {{ new Date().toLocaleDateString() }}</p>
        <div class="mt-8 flex justify-between">
          <div>
            ______________________ <br>
            <span class="text-xs">Cashier</span>
          </div>
          <div>
            ______________________ <br>
            <span class="text-xs">Student</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <ToastNotification
    :is-message="isMessage"
    :is-error="isError"
    :response-message="responseMessage"
  />
</template>

<style scoped>
@media print {
  .no-print {
    display: none !important;
  }
}
</style>
