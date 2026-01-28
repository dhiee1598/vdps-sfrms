<script setup lang="ts">
import type { FetchError } from 'ofetch';

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useVueToPrint } from 'vue-to-print';

import { socket } from '../socket';

const isConnected = ref(false);
const transport = ref('N/A');
const isOpen = ref(false);
const showCancelModal = ref(false);
const selectedItem = ref();
const itemToCancel = ref();
const searchQuery = ref('');
const selectedGrade = ref('');
const selectedStrand = ref('');
const isSubmitting = ref(false);
const isCancelling = ref(false);
const showPrintModal = ref(false);
const componentRef = ref();
const { isMessage, isError, responseMessage, showMessage } = useNotification();

const currentPage = ref(1);
const itemsPerPage = 10;

const debouncedSearch = ref('');
let searchTimeout: NodeJS.Timeout;

watch(searchQuery, (newVal) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = newVal;
    currentPage.value = 1;
  }, 300);
});

watch([selectedGrade, selectedStrand], () => {
  currentPage.value = 1;
});

// Fetch Dropdown Data
const { data: gradeLevels } = useFetch('/api/private/grade-level');
const { data: strands } = useFetch('/api/private/strands');

// Fetch Transactions (Server-Side)
const { data: transactions, refresh, pending } = useFetch('/api/private/transactions', {
  lazy: true,
  query: computed(() => ({
    page: currentPage.value,
    pageSize: itemsPerPage,
    search: debouncedSearch.value,
    status: 'pending',
    gradeLevel: selectedGrade.value,
    strand: selectedStrand.value,
  })),
});

const totalPages = computed(() => {
  return transactions.value?.totalPages || 1;
});

// 2. SMART PAGINATION LOGIC
const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 1;

  if (total <= 7)
    return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | string)[] = [];
  const left = current - delta;
  const right = current + delta;

  pages.push(1);
  if (left > 2)
    pages.push('...');
  else if (left === 2)
    pages.push(2);

  for (let i = Math.max(2, left); i <= Math.min(total - 1, right); i++) {
    pages.push(i);
  }

  if (right < total - 1)
    pages.push('...');
  else if (right === total - 1)
    pages.push(total - 1);

  if (total > 1)
    pages.push(total);

  return pages;
});

function goToPage(page: number | string) {
  if (typeof page === 'number' && page >= 1 && page <= totalPages.value) {
    currentPage.value = page;
  }
}

function openModal(item: any) {
  isOpen.value = true;
  selectedItem.value = item;
}

function confirmCancel(item: any) {
  itemToCancel.value = item;
  showCancelModal.value = true;
}

async function handleCancel() {
  if (!itemToCancel.value)
    return;
  isCancelling.value = true;
  try {
    const response = await $fetch(`/api/private/transactions/${itemToCancel.value.transaction.transaction_id}`, {
      method: 'DELETE',
    });
    showMessage(response.message || 'Transaction cancelled successfully.', false);
    showCancelModal.value = false;
    itemToCancel.value = null;
    await refresh();
  }
  catch (e) {
    const error = e as FetchError;
    showMessage(error.data?.message || 'Failed to cancel transaction.', true);
  }
  finally {
    isCancelling.value = false;
  }
}

const { handlePrint } = useVueToPrint({
  content: () => componentRef.value,
  documentTitle: 'Transaction-Receipt',
  onAfterPrint: () => {
    showPrintModal.value = false;
    selectedItem.value = null;
  },
});

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

onMounted(() => {
  if (socket.connected) {
    onConnect();
  }
  socket.on('connect', onConnect);
  socket.on('disconnect', onDisconnect);
  socket.on('newTransaction', async (message) => {
    console.warn(message);
    await refresh();
  });
});

async function handleSubmit() {
  if (!selectedItem.value)
    return;

  isSubmitting.value = true;
  try {
    const response = await $fetch(`/api/private/transactions/${selectedItem.value.transaction.transaction_id}`, {
      method: 'PUT',
      body: { status: 'paid', student_id: selectedItem.value.student.id },
    });
    isOpen.value = false;
    showPrintModal.value = true;
    handlePrint();

    showMessage(response.message, false);
    await refresh();
  }
  catch (e) {
    const error = e as FetchError;
    showMessage(error.data.message || 'An unexpected error occurred.', true);
  }
  finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="p-2 w-full">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between my-4 gap-3">
      <h2 class="text-3xl">
        Pending Transactions
      </h2>

      <div class="flex flex-col md:flex-row gap-2">
        <select
          v-model="selectedGrade"
          class="select select-bordered w-44"
          :disabled="pending"
        >
          <option value="">
            All Grades
          </option>
          <option
            v-for="grade in gradeLevels?.data"
            :key="grade.id"
            :value="grade.grade_level_name"
          >
            {{ grade.grade_level_name }}
          </option>
        </select>

        <select
          v-model="selectedStrand"
          class="select select-bordered w-44"
          :disabled="pending"
        >
          <option value="">
            All Strands
          </option>
          <option
            v-for="strand in strands?.data"
            :key="strand.id"
            :value="strand.strand_name"
          >
            {{ strand.strand_name }}
          </option>
        </select>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by Transaction ID or Student Name..."
          class="input input-bordered w-84"
          :disabled="pending"
        >
      </div>
    </div>

    <div class="overflow-x-auto min-h-[400px]">
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
            <th>Date Created</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-if="pending">
            <td colspan="9" class="text-center py-20">
              <span class="loading loading-spinner loading-lg text-primary" />
              <p class="mt-2 text-gray-500 text-sm">
                Loading pending transactions...
              </p>
            </td>
          </tr>

          <template v-else>
            <tr v-for="item in transactions?.data || []" :key="item.transaction.transaction_id">
              <td class="font-mono text-xs">
                {{ item.transaction.transaction_id.slice(0, 15) }}...
              </td>
              <td>{{ item.student.id }}</td>
              <td>{{ item.student.first_name }} {{ item.student.middle_name }} {{ item.student.last_name }}</td>
              <td>{{ item.grade_level.grade_level_name }}</td>
              <td>{{ item.strand?.strand_name || 'N/A' }}</td>
              <td><span class="badge badge-warning badge-sm font-bold uppercase text-xs">{{ item.transaction.status }}</span></td>
              <td class="font-mono">
                ₱ {{ Number(item.transaction.total_amount).toFixed(2) }}
              </td>
              <td>{{ new Date(item.transaction.createdAt).toLocaleDateString('en-US', { timeZone: "UTC", month: 'short', day: 'numeric', year: 'numeric' }) }}</td>
              <td>
                <div class="flex gap-2">
                  <button
                    class="btn btn-sm btn-success tooltip tooltip-success"
                    data-tip="View"
                    @click="openModal(item)"
                  >
                    <Icon name="solar:eye-linear" size="16" />
                  </button>
                  <button
                    class="btn btn-sm btn-error tooltip tooltip-error"
                    data-tip="Cancel"
                    @click="confirmCancel(item)"
                  >
                    <Icon name="solar:trash-bin-trash-linear" size="16" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="(transactions?.data || []).length === 0">
              <td colspan="9" class="text-center text-gray-500 py-4">
                No transactions found
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <div class="flex justify-center mt-4 space-x-2">
      <button
        class="btn btn-sm"
        :disabled="currentPage === 1 || pending"
        @click="goToPage(currentPage - 1)"
      >
        Prev
      </button>

      <template v-for="(page, index) in visiblePages" :key="index">
        <button
          v-if="page !== '...'"
          class="btn btn-sm"
          :class="{ 'btn-active': currentPage === page }"
          :disabled="pending"
          @click="goToPage(Number(page))"
        >
          {{ page }}
        </button>
        <span v-else class="btn btn-sm btn-disabled bg-transparent border-none text-gray-500">...</span>
      </template>

      <button
        class="btn btn-sm"
        :disabled="currentPage === totalPages || pending"
        @click="goToPage(currentPage + 1)"
      >
        Next
      </button>
    </div>

    <dialog :open="isOpen" class="modal">
      <div class="modal-box w-11/12 max-w-5xl bg-base-200 text-base-content rounded-xl shadow-xl">
        <div class="flex items-center justify-between border-b border-base-300 pb-3">
          <h3 class="text-xl font-semibold flex items-center gap-2">
            <Icon name="solar:document-add-linear" size="22" />
            Transaction Summary
          </h3>
        </div>
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
              <li><span class="font-medium">Strand:</span> {{ selectedItem?.strand?.strand_name || 'N/A' }}</li>
              <li><span class="font-medium">Academic Year:</span> {{ selectedItem?.academic_year.academic_year }}</li>
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
              {{ selectedItem?.transaction.transaction_id }}
            </dd>
            <dt class="font-medium">
              Status:
            </dt>
            <dd><span class="badge badge-warning badge-sm">{{ selectedItem?.transaction.status }}</span></dd>
            <dt class="font-medium">
              Total Amount:
            </dt>
            <dd class="text-success font-semibold">
              ₱ {{ Number(selectedItem?.transaction.total_amount).toFixed(2) }}
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
                  <th>Payment Type</th><th class="text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in selectedItem?.transaction_items" :key="item.id">
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
            Cancel
          </button>
          <button
            class="btn btn-primary"
            :disabled="isSubmitting"
            @click="handleSubmit"
          >
            <span v-if="isSubmitting" class="loading loading-spinner loading-xs" />
            Mark as Paid
          </button>
        </div>
      </div>
    </dialog>

    <dialog :open="showCancelModal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg text-error">
          Cancel Transaction
        </h3>
        <p class="py-4">
          Are you sure you want to cancel this transaction for
          <span class="font-bold">{{ itemToCancel?.student.first_name }} {{ itemToCancel?.student.last_name }}</span>?
          This action cannot be undone.
        </p>
        <div class="modal-action">
          <button class="btn" @click="showCancelModal = false">
            No, Keep it
          </button>
          <button
            class="btn btn-error"
            :disabled="isCancelling"
            @click="handleCancel"
          >
            <span v-if="isCancelling" class="loading loading-spinner" />
            Yes, Cancel Transaction
          </button>
        </div>
      </div>
    </dialog>

    <div ref="componentRef" class="print-area hidden print:block bg-white text-black p-2 font-mono text-[10px]">
      <div class="text-center border-b border-black pb-2 mb-2 flex flex-col justify-center items-center">
        <NuxtImg
          src="/vdps-logo.png"
          alt="Profile"
          height="40"
          width="40"
          class="mb-1"
        />
        <h2 class="text-[12px] font-bold leading-tight">
          Virgen Del Pilar School Rodriguez, Inc.
        </h2>
        <p class="text-[10px]">
          Iloilo St, Brgy, Rodriguez, Rizal
        </p>
        <p class="text-[10px] font-bold mt-1">
          OFFICIAL RECEIPT
        </p>
      </div>

      <div class="mb-2 space-y-0.5">
        <p><span class="font-bold">Student ID:</span> {{ selectedItem?.student.id }}</p>
        <p><span class="font-bold">Name:</span> {{ selectedItem?.student.first_name }} {{ selectedItem?.student.last_name }}</p>
        <p><span class="font-bold">Grade:</span> {{ selectedItem?.grade_level.grade_level_name }}</p>
        <p v-if="selectedItem?.strand"><span class="font-bold">Strand:</span> {{ selectedItem?.strand?.strand_name }}</p>
        <p><span class="font-bold">A.Y.:</span> {{ selectedItem?.academic_year.academic_year }}</p>
      </div>

      <div class="mb-2 border-t border-b border-black py-1">
        <p><span class="font-bold">Trans ID:</span> {{ selectedItem?.transaction.transaction_id.slice(0, 20) }}</p>
        <p><span class="font-bold">Status:</span> PAID</p>
      </div>

      <div class="mb-2">
        <table class="w-full text-[10px]">
          <thead>
            <tr class="border-b border-black">
              <th class="text-left py-1">Description</th>
              <th class="text-right py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in selectedItem?.transaction_items" :key="item.id">
              <td class="py-0.5">{{ item.item_type }}</td>
              <td class="text-right py-0.5">₱{{ Number(item.amount).toFixed(2) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="border-t border-black font-bold">
              <td class="py-1">TOTAL</td>
              <td class="text-right py-1">₱{{ Number(selectedItem?.transaction.total_amount).toFixed(2) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="mt-4 text-[10px]">
        <p><span class="font-bold">Date:</span> {{ new Date().toLocaleDateString() }}</p>
        <div class="mt-6 text-center">
          <p>__________________________</p>
          <p class="text-[9px]">CASHIER SIGNATURE</p>
        </div>
        <p class="text-center mt-4 italic">Thank you for your payment!</p>
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
  @page {
    size: 57mm auto;
    margin: 0;
  }
  .print-area {
    width: 57mm;
    margin: 0;
    padding: 2mm;
    display: block !important;
  }
  .no-print {
    display: none !important;
  }
}
</style>
