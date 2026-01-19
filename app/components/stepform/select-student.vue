<script setup lang="ts">
import { socket } from '~/components/socket';

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

const { data: assessments, pending, refresh } = useFetch('/api/private/assessment', {
  lazy: true,
  query: computed(() => ({
    search: debouncedSearch.value,
    pageSize: 20, 
  })),
});

watch(selected, (val) => {
  emit('update:selectedStudent', val);
});

watch(() => props.selectedStudent, (newVal) => {
  selected.value = newVal;
});

const studentOptions = computed(() => {
  return (assessments.value?.data ?? []).map((assessment: any) => ({
    ...assessment,
    name: `${assessment.student?.last_name ?? ''}, ${assessment.student?.first_name ?? ''} ${assessment.student?.middle_name ?? ''}`.trim(),
  }));
});

async function handleSocketData() {
  await refresh();
}

onMounted(() => {
  if (socket.connected) {
    //
  } else {
    socket.connect();
  }
  socket.on('newData', handleSocketData);
});

onBeforeUnmount(() => {
  socket.off('newData', handleSocketData);
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
