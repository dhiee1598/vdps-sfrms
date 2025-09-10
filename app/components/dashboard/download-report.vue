<script setup lang="ts">
const emit = defineEmits<{
  (e: 'showModal'): void;
}>();

const fileType = ref('');
const formData = ref({
  type: '',
  from_date: '',
  to_date: '',
});

async function downloadFile(type: string) {
  formData.value.type = type;

  const response = await $fetch('/api/private/report', { method: 'POST', body: formData.value, responseType: 'blob' });

  const url = window.URL.createObjectURL(response);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'report.xlsx');

  // 4. Trigger the download
  document.body.appendChild(link);
  link.click();
  link.remove();

  // 5. Clean up the URL
  window.URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex justify-between">
      <h3 class="text-lg font-bold">
        Download Report
      </h3>

      <button
        type="button"
        class="cursor-pointer"
        @click="emit('showModal')"
      >
        <Icon name="solar:close-circle-bold" size="25" />
      </button>
    </div>
    <p class="text-sm">
      Select the date range for your report.
    </p>

    <form @submit.prevent="downloadFile(fileType)">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-600">From</label>
          <input
            v-model="formData.from_date"
            type="date"
            class="input input-bordered w-full"
            required
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-600">To</label>
          <input
            v-model="formData.to_date"
            type="date"
            class="input input-bordered w-full"
            required
          >
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <button
          type="submit"
          class="btn btn-error"
          @click="fileType = 'pdf'"
        >
          Download PDF
        </button>
        <button
          type="submit"
          class="btn btn-success"
          @click="fileType = 'excel'"
        >
          Download Excel
        </button>
      </div>
    </form>
  </div>
</template>
