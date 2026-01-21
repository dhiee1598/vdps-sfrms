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

// State
const selected = ref({ ...props.selectedStudent });
const isTyping = ref(false);
const debouncedSearch = ref('');
let searchTimeout: NodeJS.Timeout;

// 1. Handle Search Input with Debounce
function handleSearchChange(query: string) {
  // If input is cleared, reset immediately
  if (!query) {
    debouncedSearch.value = '';
    isTyping.value = false;
    return;
  }

  isTyping.value = true;
  clearTimeout(searchTimeout);
  
  // Wait 600ms after typing stops before searching
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = query;
    isTyping.value = false;
  }, 600);
}

// 2. Fetch Data
// We use a specific key to ensure the hook updates the same data object
const { data: enrollments, pending, refresh } = useFetch('/api/private/enrollment', {
  key: 'student-search-fetch',
  lazy: true,
  server: false, // Perform search on client-side only
  query: computed(() => ({
    search: debouncedSearch.value,
    pageSize: 20,
  })),
  watch: [debouncedSearch], // Auto-fetch when search changes
});

// 3. Computed Options (The Flicker Fix)
const studentOptions = computed(() => {
  // If we are typing OR the fetch is loading, return empty list.
  // This hides the "old" ID immediately so you don't see the flicker.
  if (isTyping.value || pending.value || !debouncedSearch.value) {
    return [];
  }

  return (enrollments.value?.data ?? []).map((enrollment: any) => ({
    ...enrollment,
    label_display: enrollment.student_id,
  }));
});

// Sync selected value with parent
watch(selected, (val) => {
  emit('update:selectedStudent', val);
});

watch(() => props.selectedStudent, (newVal) => {
  selected.value = newVal;
});

// Socket Handler
async function handleSocketData() {
  if (debouncedSearch.value) {
    await refresh();
  }
}

onMounted(() => {
  if (!socket.connected) socket.connect();
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
        :loading="pending || isTyping"
        :disabled="disabled"
        label="label_display"
        track-by="id"
        placeholder="Enter Student ID (e.g., 0000)..."
        class="w-full border rounded-sm"
        @search-change="handleSearchChange"
      >
        <template #noResult>
          <span v-if="pending || isTyping" class="text-gray-500">Searching...</span>
          <span v-else class="text-red-500">No student found.</span>
        </template>
        
      </Multiselect>
    </div>
  </div>
</template>
