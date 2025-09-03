<script setup lang="ts">
const activeTab = ref<'completed-transaction' | 'pending-transaction'>('completed-transaction');
</script>

<template>
  <div class="p-6 w-full">
    <div class="flex gap-4 border-b pb-2 mb-4">
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
      <CashierCompletedTransactionTab v-if="activeTab === 'completed-transaction'" />
      <CashierPendingTransactionTab v-else />
    </div>
  </div>
</template>
