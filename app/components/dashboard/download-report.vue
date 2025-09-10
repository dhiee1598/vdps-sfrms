<script setup lang="ts">
const emit = defineEmits<{
  (e: 'showModal'): void;
}>();

const fileType = ref('');
const isLoading = ref(false);
const formData = ref({
  type: '',
  from_date: '',
  to_date: '',
});

async function downloadFile(type: string) {
  try {
    isLoading.value = true;
    formData.value.type = type;

    const response = await $fetch('/api/private/report', {
      method: 'POST',
      body: formData.value,
      responseType: 'blob',
    });

    const blob = response as Blob;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    link.setAttribute('download', type === 'excel' ? 'report.xlsx' : 'report.pdf');

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
  catch (error) {
    console.error('Download failed:', error);
  }
  finally {
    isLoading.value = false;
  }
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
        :disabled="isLoading"
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
          <label class="block text-sm font-medium">From</label>
          <input
            v-model="formData.from_date"
            type="date"
            class="input input-bordered w-full"
            required
          >
        </div>
        <div>
          <label class="block text-sm font-medium">To</label>
          <input
            v-model="formData.to_date"
            type="date"
            class="input input-bordered w-full"
            :min="formData.from_date"
            required
          >
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t">
        <button
          type="submit"
          class="btn btn-error"
          :disabled="isLoading"
          @click="fileType = 'pdf'"
        >
          Download PDF
        </button>
        <button
          type="submit"
          class="btn btn-success"
          :disabled="isLoading"
          @click="fileType = 'excel'"
        >
          Download Excel
        </button>
      </div>
    </form>
  </div>
</template>
