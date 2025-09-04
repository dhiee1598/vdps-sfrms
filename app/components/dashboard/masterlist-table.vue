<script setup lang="ts">
const { data: students } = await useFetch('/api/private/masterlist');
console.warn(students);
</script>

<template>
  <table class="table">
    <thead>
      <tr>
        <th>ID</th>
        <th>First Name</th>
        <th>Middle Name</th>
        <th>Last Name</th>
        <th>Address</th>
        <th>Contact</th>
        <th>Status</th>
        <th class="text-center">
          Action
        </th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in students" :key="item.enrollment.student_id">
        <td>{{ item.student?.id }}</td>
        <td>{{ item.student?.first_name }}</td>
        <td>{{ item.student?.middle_name }}</td>
        <td>{{ item.student?.last_name }}</td>
        <td>{{ item.student?.address }}</td>
        <td>{{ item.student?.contact_number }}</td>
        <td>{{ item.enrollment.enroll_status }}</td>
        <td class="flex gap-2 justify-center items-center">
          <button class="btn btn-sm btn-success">
            <Icon name="solar:eye-linear" size="24" />
          </button>
          <button class="btn btn-sm btn-primary">
            <Icon name="solar:wallet-money-linear" size="24" />
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
