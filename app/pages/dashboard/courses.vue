<script setup lang="ts">
import { ref } from 'vue';

const { data: courses, pending, error, refresh } = await useFetch('/api/private/courses');

const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

const formData = ref({
  course_name: '',
  course_description: '',
});

async function handleClick() {
  try {
    if (isEditing.value && editingId.value) {
      // UPDATE
      await $fetch(`/api/private/courses/${editingId.value}`, {
        method: 'PUT',
        body: formData.value,
      });
    }
    else {
      // CREATE
      await $fetch('/api/private/courses', {
        method: 'POST',
        body: formData.value,
      });
    }

    // reset + reload
    showModal.value = false;
    isEditing.value = false;
    editingId.value = null;
    formData.value = { course_name: '', course_description: '' };

    // refresh Nuxt data
    await refresh();
  }
  catch (err) {
    console.error(err);
  }
}

function openCreateModal() {
  isEditing.value = false;
  editingId.value = null;
  formData.value = { course_name: '', course_description: '' };
  showModal.value = true;
}

function openEditModal(course: any) {
  isEditing.value = true;
  editingId.value = course.id;
  formData.value = {
    course_name: course.course_name,
    course_description: course.course_description,
  };
  showModal.value = true;
}
</script>

<template>
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4">
      <p class="text-3xl">
        List of Courses
      </p>
      <button class="btn btn-primary" @click="openCreateModal">
        Add
      </button>
    </div>

    <div v-if="pending">
      Loading...
    </div>
    <div v-else-if="error">
      Error loading courses
    </div>
    <table v-else class="table">
      <thead>
        <tr>
          <th />
          <th>Course Name</th>
          <th>Course Description</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="course in courses" :key="course.id">
          <th>{{ course.id }}</th>
          <td>{{ course.course_name }}</td>
          <td>{{ course.course_description }}</td>
          <td>
            <button class="btn btn-primary" @click="openEditModal(course)">
              update
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <dialog :open="showModal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{ isEditing ? 'Update Course' : 'Add Course' }}
        </h3>

        <div class="modal-action">
          <form class="flex flex-col gap-4 w-full" @submit.prevent="handleClick">
            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Course Name
              </legend>
              <input
                v-model="formData.course_name"
                type="text"
                class="input w-full"
                placeholder="Type here"
                required
              >
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend">
                Course Description
              </legend>
              <input
                v-model="formData.course_description"
                type="text"
                class="input w-full"
                placeholder="Type here"
                required
              >
            </fieldset>

            <div class="flex flex-row justify-end gap-2">
              <button type="submit" class="btn btn-primary">
                {{ isEditing ? 'Update' : 'Create' }}
              </button>
              <button
                type="button"
                class="btn btn-warning"
                @click="showModal = false"
              >
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  </div>
</template>
