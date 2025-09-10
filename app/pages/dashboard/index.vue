<script setup lang="ts">
const { data: students } = await useFetch('/api/private/student');
const { data: enrolledStudents } = await useFetch('/api/private/enrollment', { lazy: true });
const { data: activeYear } = await useFetch('/api/private/academic-years?activeYear=true', { lazy: true });
const { data: activeSemester } = await useFetch('/api/private/semesters?activeSemester=true', { lazy: true });
</script>

<template>
  <div class="p-10 container flex flex-col flex-wrap">
    <div class="flex flex-col gap-4">
      <p class="text-4xl font-bold">
        Admin Dashboard
      </p>
      <p>
        Manage student enrollments and assessments in one place.
      </p>
    </div>

    <div class="flex flex-row gap-4 my-4 w-full">
      <div class="card w-full card-md shadow-sm bg-green-100 text-green-800">
        <div class="card-body">
          <h2 class="card-title">
            Total Students
          </h2>
          <p class="text-3xl font-bold">
            {{ students?.data.length }}
          </p>
          <p class="text-sm">
            Total number of students
          </p>
        </div>
      </div>

      <div class="card w-full card-md shadow-sm bg-amber-100 text-amber-800">
        <div class="card-body">
          <h2 class="card-title">
            Total Enrolled Students
          </h2>
          <p class="text-3xl font-bold">
            {{ enrolledStudents?.count }}
          </p><p class="text-sm">
            Number of enrolled students
          </p>
        </div>
      </div>

      <div class="card w-full card-md shadow-sm bg-blue-100 text-blue-800">
        <div class="card-body">
          <h2 class="card-title">
            Academic Year
          </h2>
          <p class="text-3xl font-bold">
            {{ activeYear?.data[0]?.academic_year }}
          </p>
          <p class="text-sm">
            Active academic year
          </p>
        </div>
      </div>
      <div class="card w-full card-md shadow-sm bg-blue-100 text-blue-800">
        <div class="card-body">
          <h2 class="card-title">
            Semester
          </h2>
          <p class="text-3xl font-bold">
            {{ activeSemester?.data[0]?.semester }}
          </p>
          <p class="text-sm">
            Active semester
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
