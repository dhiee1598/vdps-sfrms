<script setup lang="ts">
import type { Student } from '~~/server/lib/zod-schema';

const props = defineProps<{
  isEditing: boolean;
  student: Student;
}>();

const emit = defineEmits<{
  (e: 'update:student', value: Student): void;
  (e: 'showModal'): void;
  (e: 'submit', formData: Student): void;
}>();

const formData = computed({
  get: () => props.student,
  set: value => emit('update:student', value),
});

const localStudent = ref(props.student);

watch(() => props.student, (newVal) => {
  localStudent.value = newVal;
});
</script>

<template>
  <div>
    <form @submit.prevent="emit('submit', formData)">
      <h3 class="text-lg font-bold">
        {{ props.isEditing ? `Student ID: ${localStudent.id}` : 'Add Student' }}
      </h3>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          First name
        </legend>
        <input
          v-model="formData.first_name"
          type="text"
          class="input w-full"
          placeholder="Type here"
          required
        >
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          Middle name
        </legend>
        <input
          v-model="formData.middle_name"
          type="text"
          class="input w-full"
          placeholder="Type here"
        >
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          Last name
        </legend>
        <input
          v-model="formData.last_name"
          type="text"
          class="input w-full"
          placeholder="Type here"
          required
        >
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          Address
        </legend>
        <textarea
          v-model="formData.address"
          class="textarea w-full"
          placeholder="Type here"
          required
        />
      </fieldset>
      <fieldset class="fieldset">
        <legend class="fieldset-legend">
          Contact number
        </legend>
        <input
          v-model="formData.contact_number"
          type="text"
          class="input w-full"
          placeholder="Type here"
          required
        >
      </fieldset>

      <div class="flex flex-row justify-end gap-2 pt-2">
        <button
          type="submit"
          class="btn btn-accent"
        >
          {{ isEditing ? 'Update' : 'Add' }}
        </button>
        <button
          type="button"
          class="btn"
          @click="emit('showModal')"
        >
          Close
        </button>
      </div>
    </form>
  </div>
</template>
