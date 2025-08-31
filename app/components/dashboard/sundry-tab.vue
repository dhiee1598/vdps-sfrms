<!-- components/dashboard/SundryTab.vue -->
<script setup lang="ts">
import { ref } from 'vue';

// Example local state (optional)
const sundries = ref([
  { id: 1, name: 'Photocopy', price: 5 },
  { id: 2, name: 'ID Lace', price: 20 },
]);
</script>

<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">
      List of Sundries
    </h2>

    <table class="table w-full">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Price (₱)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in sundries" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.name }}</td>
          <td>{{ item.price }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
