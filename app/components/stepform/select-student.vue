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
  <Multiselect
    v-model="selected"
    :options="allStudents"
    :searchable="true"
    label="name"
    track-by="id"
    placeholder="Search by name..."
    :max-height="200"
    class="w-full"
  />
</template>
