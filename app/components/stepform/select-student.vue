<script setup lang="ts">
const props = defineProps({
  selectedStudent: {
    type: Object,
    default: () => ({}),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:selectedStudent']);
const selected = ref({ ...props.selectedStudent });
const studentSearch = ref('');
let searchTimeout: NodeJS.Timeout;

const debouncedSearch = ref('');

// Debounce the search input
function handleSearchChange(query: string) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = query;
  }, 300);
}

const { data: assessments, pending } = useFetch('/api/private/assessment', {
  lazy: true,
  query: computed(() => ({
    search: debouncedSearch.value,
    pageSize: 20, // Limit results for dropdown
  })),
});

watch(selected, (val) => {
  emit('update:selectedStudent', val);
});

const studentOptions = computed(() => {
  return (assessments.value?.data ?? []).map((assessment: any) => ({
    ...assessment,
    name: `${assessment.student?.last_name ?? ''}, ${assessment.student?.first_name ?? ''} ${assessment.student?.middle_name ?? ''}`.trim(),
  }));
});
</script>

<template>
  <div class="w-full flex flex-col justify-center items-center">
    <div class="text-2xl md:text-4xl font-black uppercase py-10">
      Student Payment Kiosk System
    </div>
    <NuxtImg
      src="/vdps-logo.png"
      alt="Logo"
      height="200"
      width="200"
      class="mb-6"
    />

    <div class="form-control w-full max-w-md mx-auto text-left">
      <label class="label">
        <span class="label-text">Search by Student Name:</span>
      </label>
      <Multiselect
        v-model="selected"
        :options="studentOptions"
        :searchable="true"
        :internal-search="false"
        :loading="pending || disabled"
        :disabled="disabled"
        label="name"
        track-by="id"
        placeholder="Search by name..."
        class="w-full border rounded-sm"
        @search-change="handleSearchChange"
      >
        <template #noResult>
          <span>No student found.</span>
        </template>
      </Multiselect>
    </div>
  </div>
</template>
