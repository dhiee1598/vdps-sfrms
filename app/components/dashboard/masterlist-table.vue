<script setup lang="ts">
import type { FetchError } from 'ofetch';

import Multiselect from 'vue-multiselect'; // ✅ import the component
// ✅ import styles
const { isMessage, isError, responseMessage, showMessage } = useNotification();

const isEditing = ref(false);
const showFormModal = ref(false);
const isSubmitting = ref(false);
const currentPage = ref(1);
const pageSize = 5;
const maxVisiblePages = 4;
const searchQuery = ref('');

// fetch students from backend
const { data: students, pending, error, refresh } = await useFetch('/api/private/masterlist', { lazy: true });
const { data: allStudents } = await useFetch('/api/private/student?enrolled=true');
const { data: semesters } = await useFetch('/api/private/semesters');
const { data: gradeLevels } = await useFetch('/api/private/grade-level');
const { data: strands } = await useFetch('/api/private/strands');
const { data: academicYears } = await useFetch('/api/private/academic-years');

const studentsData = computed(() =>
  (allStudents.value?.data ?? []).map((student: any) => ({
    id: student.id,
    first_name: student.first_name,
    middle_name: student.middle_name,
    last_name: student.last_name,
    // build one nice label for display/search
    fullName: `${student.id} — ${student.first_name} ${student.middle_name ?? ''} ${student.last_name}`.trim(),
  })),
);
const filteredStudents = computed(() => {
  if (!students.value?.data)
    return [];
  if (!searchQuery.value)
    return students.value.data;

  return students.value.data.filter((s) => {
    const stu = s.student;
    if (!stu)
      return false; // in case leftJoin gave null

    return `${stu.first_name ?? ''} ${stu.middle_name ?? ''} ${stu.last_name ?? ''} ${stu.address ?? ''} ${stu.contact_number ?? ''}`
      .toLowerCase()
      .includes(searchQuery.value.toLowerCase());
  });
});

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredStudents.value.slice(start, start + pageSize);
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredStudents.value.length / pageSize));
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;

  if (total <= maxVisiblePages) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: number[] = [];
  const half = Math.floor(maxVisiblePages / 2);

  let start = Math.max(2, current - half);
  let end = Math.min(total - 1, current + half);

  if (current <= half) {
    start = 2;
    end = maxVisiblePages;
  }
  else if (current >= total - half) {
    start = total - maxVisiblePages + 1;
    end = total - 1;
  }

  pages.push(1);
  if (start > 2)
    pages.push(-1); // gap marker
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1)
    pages.push(-2); // gap marker
  pages.push(total);

  return pages;
});

// reactive form state
const formData = ref({
  selectedStudent: null as null | { id: string; first_name: string; middle_name?: string; last_name: string },
  selectedSemester: null as null | { id: string; semester: string },
  selectedGradeLevel: null as null | { id: string; grade_level_name: string },
  selectedStrand: null as null | { id: string; strand_name: string },
  selectedAcademicYear: null as null | { id: string; academic_year: string },
});

function openAddStudentModal() {
  showFormModal.value = true;
  isEditing.value = false;
  formData.value.selectedStudent = null;
}

async function handleSave() {
  if (!formData.value.selectedStudent)
    return;

  // build payload here → only IDs
  const payload = {
    student_id: formData.value.selectedStudent?.id,
    semester_id: formData.value.selectedSemester?.id,
    grade_level_id: formData.value.selectedGradeLevel?.id,
    strand_id: formData.value.selectedStrand?.id,
    academic_year_id: formData.value.selectedAcademicYear?.id,
  };

  isSubmitting.value = true;

  try {
    let response;
    if (isEditing.value) {
      response = await $fetch(`/api/private/masterlist/${payload.student_id}`, {
        method: 'PUT',
        body: payload,
      });
    }
    else {
      response = await $fetch('/api/private/masterlist', {
        method: 'POST',
        body: payload,
      });
    }

    // if successful → close modal + reset form
    showFormModal.value = false;
    formData.value = { selectedStudent: null, selectedSemester: null, selectedGradeLevel: null, selectedStrand: null, selectedAcademicYear: null };
    showMessage(response.message, false);
    await refresh();
  }
  catch (e) {
    const error = e as FetchError;
    showMessage(error.data.message || 'An unexpected error occurred.', true);
  }
}

watch(searchQuery, () => {
  currentPage.value = 1;
});
</script>

<template>
  <div class="flex flex-row justify-between my-4 items-center">
    <p class="text-3xl">
      MASTERLIST
    </p>
    <div class="flex space-x-2">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search students..."
        class="input input-bordered w-64"
      >
      <button class="btn btn-primary" @click="openAddStudentModal">
        <Icon name="solar:add-square-linear" size="24" /> Enroll Student
      </button>
    </div>
  </div>
  <table class="table">
    <thead>
      <tr>
        <th>ID</th>
        <th>First Name</th>
        <th>Middle Name</th>
        <th>Last Name</th>
        <th>Address</th>
        <th>Contact</th>
        <th>Status</th>
        <th class="text-center">
          Action
        </th>
      </tr>
    </thead>

    <tbody>
      <tr v-if="pending">
        <td colspan="7" class="text-center py-4">
          <span class="loading loading-ring loading-lg" />
        </td>
      </tr>

      <tr v-else-if="error">
        <td colspan="7" class="text-center text-red-500 py-4">
          Failed to load students. Please try again.
        </td>
      </tr>
      <tr v-for="item in paginatedStudents" :key="item.enrollment.student_id">
        <td>{{ item.student?.id }}</td>
        <td>{{ item.student?.first_name }}</td>
        <td>{{ item.student?.middle_name }}</td>
        <td>{{ item.student?.last_name }}</td>
        <td>{{ item.student?.address }}</td>
        <td>{{ item.student?.contact_number }}</td>
        <td>{{ item.enrollment.enroll_status }}</td>
        <td class="flex gap-2 justify-center items-center">
          <button class="btn btn-sm btn-success">
            <Icon name="solar:eye-linear" size="24" />
          </button>
          <button class="btn btn-sm btn-primary">
            <Icon name="solar:wallet-money-linear" size="24" />
          </button>
        </td>
      </tr>
    </tbody>
  </table>
  <div class="flex justify-center mt-4 space-x-2">
    <button
      class="btn btn-sm"
      :disabled="currentPage === 1"
      @click="currentPage--"
    >
      Prev
    </button>

    <template v-for="page in visiblePages" :key="page">
      <button
        v-if="page > 0"
        class="btn btn-sm"
        :class="{ 'btn-active': currentPage === page }"
        @click="currentPage = page"
      >
        {{ page }}
      </button>
      <span v-else class="px-2">…</span>
    </template>

    <button
      class="btn btn-sm"
      :disabled="currentPage === totalPages"
      @click="currentPage++"
    >
      Next
    </button>
  </div>
  <dialog :open="showFormModal" class="modal">
    <div class="modal-box">
      <h3 class="font-bold text-lg">
        Enroll A Student
      </h3>
      <form class="flex flex-col gap-4 w-full mt-4" @submit.prevent="handleSave">
        <div class="flex flex-col gap-4 mt-4">
          <Multiselect
            v-model="formData.selectedStudent"
            :options="studentsData"
            :searchable="true"
            label="fullName"
            track-by="fullName"
            placeholder="Search by id, first name, last name or full name..."
          />

          <Multiselect
            v-model="formData.selectedAcademicYear"
            :options="academicYears?.filter((s) => s.status).map((s) => ({ id: s.id, academic_year: s.academic_year })) ?? []"
            :searchable="true"
            label="academic_year"
            track-by="academic_year"
            placeholder="Search academic year..."
          >
            <template #option="{ option }">
              {{ option.academic_year }}
            </template>
            <template #singleLabel="{ option }">
              {{ option.academic_year }}
            </template>
          </Multiselect>

          <Multiselect
            v-model="formData.selectedStrand"
            :options="strands?.map((s) => ({ id: s.id, strand_name: s.strand_name })) ?? []"
            :searchable="true"
            label="strand_name"
            track-by="strand_name"
            placeholder="Search strand..."
          >
            <template #option="{ option }">
              {{ option.strand_name }}
            </template>
            <template #singleLabel="{ option }">
              {{ option.strand_name }}
            </template>
          </Multiselect>

          <Multiselect
            v-model="formData.selectedGradeLevel"
            :options="gradeLevels?.map((g) => ({ id: g.id, grade_level_name: g.grade_level_name })) ?? []"
            :searchable="true"
            label="grade_level_name"
            track-by="grade_level_name"
            placeholder="Search grade level..."
          >
            <template #option="{ option }">
              {{ option.grade_level_name }}
            </template>
            <template #singleLabel="{ option }">
              {{ option.grade_level_name }}
            </template>
          </Multiselect>

          <Multiselect
            v-model="formData.selectedSemester"
            :options="semesters?.filter((s) => s.status).map((s) => ({ id: s.id, semester: s.semester })) ?? []"
            :searchable="true"
            label="semester"
            track-by="semester"
            placeholder="Search semester..."
          >
            <template #option="{ option }">
              {{ option.semester }}
            </template>
            <template #singleLabel="{ option }">
              {{ option.semester }}
            </template>
          </Multiselect>
        </div>

        <div class="modal-action">
          <button class="btn btn-primary" type="submit">
            Save
          </button>
          <button class="btn" @click="showFormModal = false">
            Close
          </button>
        </div>
      </form>
    </div>
  </dialog>
  <ToastNotification
    :is-message="isMessage"
    :is-error="isError"
    :response-message="responseMessage"
  />
</template>
