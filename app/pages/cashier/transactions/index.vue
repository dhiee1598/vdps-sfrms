<script setup lang="ts">
const activeTab = ref<'completed-transaction' | 'pending-transaction'>('completed-transaction');
const showModal = ref(false);
function closeModal() {
  showModal.value = false;
}
const { isMessage, isError, responseMessage, showMessage } = useNotification();
</script>

<template>
  <div class="p-6 w-full">
    <div class="flex flex-row justify-between items-center gap-4 border-b pb-2 mb-4">
      <div>
        <button
          class="px-4 py-2 hover:bg-base-200 rounded-tl-lg rounded-tr-lg"
          :class="[activeTab === 'completed-transaction' ? 'border-b-2 border-blue-500' : '']"
          @click="activeTab = 'completed-transaction'"
        >
          Completed Transactions
        </button>
        <button
          class="px-4 py-2 hover:bg-base-200 rounded-tl-lg rounded-tr-lg"
          :class="[activeTab === 'pending-transaction' ? 'border-b-2 border-blue-500' : '']"
          @click="activeTab = 'pending-transaction'"
        >
          Pending Transactions
        </button>
      </div>
      <div>
        <button class="btn btn-accent" @click="showModal = true">
          <Icon name="solar:add-circle-linear" size="24" />Add Transaction
        </button>
      </div>
    </div>

    <div>
      <CashierCompletedTransactionTab v-if="activeTab === 'completed-transaction'" />
      <CashierPendingTransactionTab v-else />
    </div>

    <dialog class="modal" :open="showModal">
      <div class="modal-box w-11/12 max-w-5xl">
        <CashierGenerateTransactionForm @show-modal="closeModal" @show-message="showMessage" />
      </div>
    </dialog>
    <ToastNotification
      :is-message="isMessage"
      :is-error="isError"
      :response-message="responseMessage"
    />
  </div>
</template>
