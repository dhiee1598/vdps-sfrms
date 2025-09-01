<script setup lang="ts">
const props = defineProps<{
  isMessage: boolean;
  isError: boolean;
  responseMessage: string;
}>();
</script>

<template>
  <div v-if="props.isMessage" class="toast toast-end z-[1000] w-auto">
    <div class="alert" :class="props.isError ? 'alert-error' : 'alert-success'">
      <span>{{ props.responseMessage }}</span>
    </div>
  </div>
</template>
