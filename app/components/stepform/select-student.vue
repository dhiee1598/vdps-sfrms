<script setup lang="ts">
const props = defineProps({
  selectedStudent: {
    type: Object,
    default: () => ({}),
  },
  allStudent: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:selectedStudent']);
const selected = ref({ ...props.selectedStudent });

watch(selected, (val) => {
  emit('update:selectedStudent', val);
});

const allStudents = computed(() =>
  (props.allStudent ?? []).map((s: any) => ({
    ...s,
    name: `${s.student?.first_name ?? ''} ${s.student?.middle_name ?? ''} ${s.student?.last_name ?? ''}`.trim(),
  })),
);
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
      provider="static"
    />

    <div class="form-control w-full max-w-md mx-auto text-left">
      <label class="label">
        <span class="label-text">Search by Student Name:</span>
      </label>
      <Multiselect
        v-model="selected"
        :options="allStudents"
        :searchable="true"
        label="name"
        track-by="id"
        placeholder="Search by name..."
        class="w-full border rounded-sm"
      />
    </div>
  </div>
</template>
