<script setup lang="ts">
const isEditing = ref(false);
const showFormModal = ref(false);

function openAddStudentModal() {
  isEditing.value = false;
  studentData.value = {
    first_name: '',
    middle_name: '',
    last_name: '',
    address: '',
    contact_number: '',
  };
  showFormModal.value = true;
}
</script>

<template>
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4 items-center">
      <p class="text-3xl">
        MASTERLIST
      </p>
      <div class="flex space-x-2">
        <input

          type="text"
          placeholder="Search students..."
          class="input input-bordered w-64"
        >
        <button class="btn btn-primary" @click="openAddStudentModal">
          <Icon name="solar:add-square-linear" size="24" /> Enroll Student
        </button>
      </div>
    </div>

    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>First Name</th>
          <th>Middle Name</th>
          <th>Last Name</th>
          <th>Address</th>
          <th>Contact</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        <!-- <tr v-if="pending">
          <td colspan="7" class="text-center py-4">
            <span class="loading loading-ring loading-lg" />
          </td>
        </tr> -->
        <!--
        <tr v-else-if="error">
          <td colspan="7" class="text-center text-red-500 py-4">
            Failed to load students. Please try again.
          </td>
        </tr> -->

        <!-- <tr
          v-for="student in paginatedStudents"
          v-else
          :key="student.id"
        >
          <th>{{ student.id }}</th>
          <td>{{ student.first_name }}</td>
          <td>{{ student.middle_name }}</td>
          <td>{{ student.last_name }}</td>
          <td>{{ student.address }}</td>
          <td>{{ student.contact_number }}</td>
          <td>
            <button class="btn btn-primary btn-sm" @click="updateStudent(student)">
              Update
            </button>
          </td>
        </tr> -->
      </tbody>
    </table>
  </div>
</template>
