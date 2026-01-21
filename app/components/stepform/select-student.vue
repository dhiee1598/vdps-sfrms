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
const isTyping = ref(false);
let searchTimeout: NodeJS.Timeout;

const debouncedSearch = ref('');

// Debounce the search input
function handleSearchChange(query: string) {
  isTyping.value = true;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = query;
    isTyping.value = false;
  }, 1500);
}

const { data: enrollments, pending, refresh } = useFetch('/api/private/enrollment', {
  lazy: true,
  immediate: false,
  query: computed(() => ({
    search: debouncedSearch.value,
    pageSize: 20,
  })),
});

watch(debouncedSearch, async (newVal) => {
  if (newVal) {
    await refresh();
  }
});

watch(selected, (val) => {
  emit('update:selectedStudent', val);
});

watch(() => props.selectedStudent, (newVal) => {
  selected.value = newVal;
});

const studentOptions = computed(() => {
  if (!debouncedSearch.value)
    return [];

  return (enrollments.value?.data ?? []).map((enrollment: any) => ({
    ...enrollment,
    label_display: enrollment.student_id,
  }));
});

async function handleSocketData() {
  if (debouncedSearch.value) {
    await refresh();
  }
}

onMounted(() => {
  if (socket.connected) {
    //
  }
  else {
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
        <span class="label-text">Search by Student ID:</span>
      </label>
      <Multiselect
        v-model="selected"
        :options="studentOptions"
        :searchable="true"
        :internal-search="false"
        :loading="pending || disabled || isTyping"
        :disabled="disabled"
        label="label_display"
        track-by="id"
        placeholder="Enter Student ID (e.g., 0000)..."
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
