<script setup lang="ts">
import { onMounted, ref } from 'vue';

const courses = ref<any[]>([]);
const showModal = ref(false);
const isEditing = ref(false); // track mode
const editingId = ref<number | null>(null);

const formData = ref({
  course_name: '',
  course_description: '',
});

// fetch users
async function loadCourses() {
  courses.value = await $fetch('/api/private/courses', { method: 'GET' });
}

// call on mount
onMounted(() => {
  loadCourses();
});

async function handleClick() {
  try {
    if (isEditing.value && editingId.value) {
      // UPDATE
      const response = await $fetch(`/api/private/courses/${editingId.value}`, {
        method: 'PUT',
        body: formData.value,
      });
      console.warn(response, 'update response');
    }
    else {
      // CREATE
      const response = await $fetch('/api/private/courses', {
        method: 'POST',
        body: formData.value,
      });
      console.warn(response, 'create response');
    }

    // reset + reload
    showModal.value = false;
    isEditing.value = false;
    editingId.value = null;
    formData.value = { course_name: '', course_description: '' };
    await loadCourses();
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
  formData.value = { course_name: course.course_name, course_description: course.course_description };
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
    <table class="table">
      <!-- head -->
      <thead>
        <tr>
          <th />
          <th>Course Name</th>
          <th>Course Description</th>
        </tr>
      </thead>
      <tbody>
        <!-- row 1 -->

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
