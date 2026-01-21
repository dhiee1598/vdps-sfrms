<script setup lang="ts">
const { data: students } = await useFetch('/api/private/student');
const { data: enrolledStudents } = await useFetch('/api/private/enrollment', { lazy: true });
const { data: activeYear } = await useFetch('/api/private/academic-years?activeYear=true', { lazy: true });
const { data: analytics } = await useFetch('/api/private/dashboard/analytics', { lazy: true });
</script>

<template>
  <div class="p-10 container flex flex-col flex-wrap gap-6">
    <div class="flex flex-col gap-4">
      <p class="text-4xl font-bold">
        Admin Dashboard
      </p>
      <p>
        Manage student enrollments and school performance.
      </p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      <div class="card w-full card-md shadow-sm bg-green-100 text-green-800">
        <div class="card-body">
          <h2 class="card-title">
            Total Students
          </h2>
          <p class="text-3xl font-bold">
            {{ students?.total || 0 }}
          </p>
          <p class="text-sm">
            Total registered
          </p>
        </div>
      </div>

      <div class="card w-full card-md shadow-sm bg-amber-100 text-amber-800">
        <div class="card-body">
          <h2 class="card-title">
            Enrolled
          </h2>
          <p class="text-3xl font-bold">
            {{ enrolledStudents?.total || 0 }}
          </p><p class="text-sm">
            Actively enrolled
          </p>
        </div>
      </div>

      <div class="card w-full card-md shadow-sm bg-blue-100 text-blue-800">
        <div class="card-body">
          <h2 class="card-title">
            Academic Year
          </h2>
          <p class="text-3xl font-bold">
            {{ activeYear?.data[0]?.academic_year || 'N/A' }}
          </p>
          <p class="text-sm">
            Current Session
          </p>
        </div>
      </div>

      <div class="card w-full card-md shadow-sm bg-purple-100 text-purple-800">
        <div class="card-body">
          <h2 class="card-title">
            Total Revenue
          </h2>
          <p class="text-3xl font-bold truncate">
            ₱{{ Number(analytics?.totalRevenue || 0).toLocaleString() }}
          </p>
          <p class="text-sm">
            Collected All Time
          </p>
        </div>
      </div>
    </div>

    <!-- Analytics Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      <!-- Grade Level Analytics -->
      <div class="card bg-base-100 shadow-md border border-base-200">
        <div class="card-body">
          <h3 class="card-title text-lg mb-4">
            Enrollment by Grade Level
          </h3>
          <div class="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-4">
            <div
              v-for="grade in analytics?.gradeLevelStats"
              :key="grade.name"
              class="w-full"
            >
              <div class="flex justify-between text-sm mb-1">
                <span class="font-medium">{{ grade.name }}</span>
                <span>{{ grade.count }} students</span>
              </div>
              <progress
                class="progress progress-primary w-full"
                :value="grade.count"
                :max="enrolledStudents?.total || 1"
              />
            </div>
            <div v-if="!analytics?.gradeLevelStats?.length" class="text-gray-500 text-center py-4">
              No enrollment data available.
            </div>
          </div>
        </div>
      </div>

      <!-- Strand Analytics -->
      <div class="card bg-base-100 shadow-md border border-base-200">
        <div class="card-body">
          <h3 class="card-title text-lg mb-4">
            SHS Enrollment by Strand
          </h3>
          <div class="flex flex-col gap-3">
            <div
              v-for="strand in analytics?.strandStats"
              :key="strand.name"
              class="w-full"
            >
              <div class="flex justify-between text-sm mb-1">
                <span class="font-medium">{{ strand.name }}</span>
                <span>{{ strand.count }} students</span>
              </div>
              <progress
                class="progress progress-accent w-full"
                :value="strand.count"
                :max="enrolledStudents?.total || 1"
              />
            </div>
            <div v-if="!analytics?.strandStats?.length" class="text-gray-500 text-center py-4">
              No SHS enrollment data available.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
