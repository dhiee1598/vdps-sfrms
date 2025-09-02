<script setup lang="ts">
const activeTab = ref<'sundries' | 'fees'>('sundries');
</script>

<template>
  <div class="p-6 w-full">
    <div class="flex gap-4 border-b pb-2 mb-4">
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
      <DashboardSundryTab v-if="activeTab === 'sundries'" />
      <DashboardFeeTab v-else />
    </div>
  </div>
</template>
