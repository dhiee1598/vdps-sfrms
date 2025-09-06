<script setup lang="ts">
const { data: transactions } = await useFetch('/api/private/transactions');
console.warn(transactions.value);
</script>

<template>
  <div class="p-2 w-full">
    <div class="flex flex-row justify-between my-4">
      <h2 class="text-3xl">
        Completed Transactions
      </h2>
    </div>
    <div class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr>
            <th class="">
              transaction id
            </th>
            <th class="">
              Student Id
            </th>
            <th class="">
              Student Name
            </th>
            <th class="">
              Status
            </th>
            <th class="">
              Amount
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in transactions?.data.filter(t => t.transaction.status === 'paid')"
            :key="item.transaction.transaction_id"
          >
            <td>{{ item.transaction.transaction_id }}</td>
            <td>{{ item.student.id }}</td>
            <td>{{ item.student.first_name }} {{ item.student.last_name }}</td>
            <td>{{ item.transaction.status }}</td>
            <td>{{ item.transaction.total_amount }}</td>
            <td>
              <button class="btn btn-sm btn-primary">
                Edit
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
