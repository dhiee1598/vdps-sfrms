<script setup lang="ts">
import { socket } from '~/components/socket';

const { data: stats, refresh } = useFetch('/api/private/transactions/stats', { lazy: true });

onMounted(() => {
  if (socket.connected) {
    socket.on('newTransaction', async () => {
      await refresh();
    });
  }
});
</script>

<template>
  <div class="p-10 container">
    <div class="flex flex-col gap-4">
      <p class="text-3xl font-bold">
        Cashier Dashboard
      </p>
      <p>
        Process student payments and manage transactions
      </p>
    </div>

    <div class="flex flex-row gap-4 my-4 w-full justify-between">
      <div class="card w-full card-md shadow-sm bg-green-100 text-green-800">
        <div class="card-body">
          <h2 class="card-title">
            Today's Collection
          </h2>
          <p class="text-5xl font-bold">
            P{{ Number(stats?.todayPaidAmount || 0).toFixed(2) }}
          </p><p>+{{ stats?.todayPaidCount || 0 }} transactions completed</p>
        </div>
      </div>

      <div class="card w-full card-md shadow-sm bg-amber-100 text-amber-800">
        <div class="card-body">
          <h2 class="card-title">
            Pending Slips
          </h2>
          <p class="text-5xl font-bold">
            {{ stats?.pendingCount || 0 }}
          </p><p>awaiting payment processing</p>
        </div>
      </div>

      <div class="card w-full card-md shadow-sm bg-blue-100 text-blue-800">
        <div class="card-body">
          <h2 class="card-title">
            Completed Today
          </h2>
          <p class="text-5xl font-bold">
            {{ stats?.todayPaidCount || 0 }}
          </p><p>Successfully processed payments</p>
        </div>
      </div>
    </div>

    <div>
      <p>RECENT TRANSACTIONS</p>
    </div>
  </div>
</template>
