<script setup lang="ts">
const { data: transactions } = await useFetch('/api/private/transactions');
</script>

<template>
  <div class="w-full p-10">
    <DashboardTransactionLog :transactions="transactions" />
  </div>
</template>
