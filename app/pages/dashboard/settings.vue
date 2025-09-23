<script setup lang="ts">
const activeTab = ref<'sundries' | 'fees' | 'academic-years' | 'grade-levels' | 'strands' | 'section' | 'semester'>('academic-years');
</script>

<template>
  <div class="p-6 w-full">
    <div class="flex gap-4 border-b pb-2 mb-4">
      <button
        class="px-4 py-2 hover:bg-base-200 rounded-tl-lg rounded-tr-lg"
        :class="[activeTab === 'academic-years' ? 'border-b-2 border-blue-500' : '']"
        @click="activeTab = 'academic-years'"
      >
        Academic-years
      </button>

      <button
        class="px-4 py-2 hover:bg-base-200 rounded-tl-lg rounded-tr-lg"
        :class="[activeTab === 'semester' ? 'border-b-2 border-blue-500' : '']"
        @click="activeTab = 'semester'"
      >
        Semester
      </button>
      <button
        class="px-4 py-2 hover:bg-base-200 rounded-tl-lg rounded-tr-lg"
        :class="[activeTab === 'grade-levels' ? 'border-b-2 border-blue-500' : '']"
        @click="activeTab = 'grade-levels'"
      >
        Grade-levels
      </button>

      <button
        class="px-4 py-2 hover:bg-base-200 rounded-tl-lg rounded-tr-lg"
        :class="[activeTab === 'section' ? 'border-b-2 border-blue-500' : '']"
        @click="activeTab = 'section'"
      >
        Section
      </button>

      <button
        class="px-4 py-2 hover:bg-base-200 rounded-tl-lg rounded-tr-lg"
        :class="[activeTab === 'strands' ? 'border-b-2 border-blue-500' : '']"
        @click="activeTab = 'strands'"
      >
        Strands
      </button>

      <button
        class="px-4 py-2 hover:bg-base-200 rounded-tl-lg rounded-tr-lg"
        :class="[activeTab === 'sundries' ? 'border-b-2 border-blue-500' : '']"
        @click="activeTab = 'sundries'"
      >
        Sundries
      </button>
      <button
        class="px-4 py-2 hover:bg-base-200 rounded-tl-lg rounded-tr-lg"
        :class="[activeTab === 'fees' ? 'border-b-2 border-blue-500' : '']"
        @click="activeTab = 'fees'"
      >
        Fees
      </button>
    </div>

    <div>
      <DashboardAcademicYear v-if="activeTab === 'academic-years'" />
      <DashboardSemesters v-else-if="activeTab === 'semester'" />
      <DashboardGradeLevel v-else-if="activeTab === 'grade-levels'" />
      <DashboardSection v-else-if="activeTab === 'section'" />
      <DashboardStrands v-else-if="activeTab === 'strands'" />
      <DashboardSundryTab v-else-if="activeTab === 'sundries'" />
      <DashboardFeeTab v-else />
    </div>
  </div>
</template>
