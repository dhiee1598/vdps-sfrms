<script setup lang="ts">
import { socket } from '~/components/socket';

const { data: stats, refresh: refreshStats } = useFetch('/api/private/transactions/stats', { lazy: true });
const { data: recentTransactions, refresh: refreshRecent } = useFetch('/api/private/transactions', {
  lazy: true,
  query: {
    pageSize: 5,
    status: 'paid', // Show recent PAID transactions
  },
});

onMounted(() => {
  if (socket.connected) {
    socket.on('newTransaction', async () => {
      await refreshStats();
      await refreshRecent();
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
            ₱{{ Number(stats?.todayPaidAmount || 0).toFixed(2) }}
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

    <div class="mt-8">
      <h3 class="text-xl font-bold mb-4">
        Recent Transactions
      </h3>
      <div class="overflow-x-auto bg-base-100 rounded-lg shadow-sm border border-base-200">
        <table class="table w-full">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Student Name</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!recentTransactions?.data?.length">
              <td colspan="5" class="text-center py-4 text-gray-500">
                No recent transactions found.
              </td>
            </tr>
            <tr v-for="tx in recentTransactions?.data" :key="tx.transaction.transaction_id">
              <td class="font-mono text-xs">
                {{ tx.transaction.transaction_id.slice(0, 15) }}...
              </td>
              <td>{{ tx.student?.first_name }} {{ tx.student?.last_name }}</td>
              <td class="font-medium">
                ₱{{ Number(tx.transaction.total_amount).toFixed(2) }}
              </td>
              <td>
                <span class="badge badge-success badge-sm uppercase text-xs font-bold">{{ tx.transaction.status }}</span>
              </td>
              <td class="text-sm">
                {{ new Date(tx.transaction.date_paid || tx.transaction.createdAt).toLocaleDateString() }}
                {{ new Date(tx.transaction.date_paid || tx.transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
