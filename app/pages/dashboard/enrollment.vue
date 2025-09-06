<script setup lang="ts">
import type { EnrolledStudent } from '~~/server/lib/zod-schema';
import type { FetchError } from 'ofetch';

const { isMessage, isError, responseMessage, showMessage } = useNotification();

const isEditing = ref(false);
const showFormModal = ref(false);
const isSubmitting = ref(false);
const currentPage = ref(1);
const pageSize = 10;
const maxVisiblePages = 4;
const searchQuery = ref('');
const showViewModal = ref(false);

const enrolledStudentData = ref<EnrolledStudent | null>({
  id: 0,
  student_id: '',
  first_name: '',
  middle_name: null,
  last_name: '',
  address: '',
  contact_number: '',
  grade_level: '',
  academic_year: '',
  semester: '',
  strand_name: '',
  date_enrolled: null,
  createdAt: null,
});

function closeModal() {
  enrolledStudentData.value = null;
  showViewModal.value = false;
}

// fetch students from backend
// const { data: students } = await useFetch('/api/private/enrollment');
const { data: enrolledStudents, pending, error, refresh: refreshEnroll } = await useFetch('/api/private/enrolled-students', { lazy: true });
const { data: allStudents, refresh: refreshStudent } = await useFetch('/api/private/student?enrolled=true');
const { data: semesters } = await useFetch('/api/private/semesters?activeSemester=true');
const { data: gradeLevels } = await useFetch('/api/private/grade-level');
const { data: strands } = await useFetch('/api/private/strands');
const { data: academicYears } = await useFetch('/api/private/academic-years?activeYear=true');

function openViewModal(item: any) {
  enrolledStudentData.value = {
    ...item,
  };
  showViewModal.value = true;
}

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
  if (!enrolledStudents.value?.data)
    return [];
  if (!searchQuery.value)
    return enrolledStudents.value.data;

  return enrolledStudents.value.data.filter((s) => {
    const stu = s;
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
    semester_id: semesters.value?.data[0]?.id,
    grade_level_id: formData.value.selectedGradeLevel?.id,
    strand_id: formData.value.selectedStrand?.id,
    academic_year_id: academicYears.value?.data[0]?.id,
  };

  isSubmitting.value = true;

  try {
    let response;
    if (isEditing.value) {
      response = await $fetch(`/api/private/enrollment/${payload.student_id}`, {
        method: 'PUT',
        body: payload,
      });
    }
    else {
      response = await $fetch('/api/private/enrollment', {
        method: 'POST',
        body: payload,
      });
    }

    showFormModal.value = false;
    formData.value = { selectedStudent: null, selectedSemester: null, selectedGradeLevel: null, selectedStrand: null, selectedAcademicYear: null };
    showMessage(response.message, false);
    await refreshEnroll();
    await refreshStudent();
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
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4 items-center">
      <p class="text-3xl">
        List of Enrolled Students
      </p>
      <div class="flex space-x-2">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search students..."
          class="input input-bordered w-64"
        >
        <button class="btn btn-accent" @click="openAddStudentModal">
          <Icon name="solar:add-circle-linear" size="24" /> Enroll Student
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
          <th>Strand</th>
          <th>Grade Level</th>
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
        <tr v-for="item in paginatedStudents" :key="item.id">
          <td>{{ item?.id }}</td>
          <td>{{ item?.first_name }}</td>
          <td>{{ item?.middle_name }}</td>
          <td>{{ item?.last_name }}</td>
          <td>{{ item?.strand_name }}</td>
          <td>{{ item?.grade_level }}</td>
          <td>{{ item.enroll_status }}</td>
          <td class="flex gap-2 justify-center items-center">
            <button class="btn btn-sm btn-success" @click="openViewModal(item)">
              <Icon name="solar:eye-linear" size="24" />
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
        <h3 class="font-bold text-2xl mb-6 text-center">
          New Enrollment Form
        </h3>
        <div class="flex flex-col">
          <div class="font-light">
            Year: {{ academicYears?.data[0]?.academic_year }}
          </div>
          <div class="font-light">
            Semester: {{ semesters?.data[0]?.semester }}
          </div>
        </div>
        <form class="flex flex-col gap-4 w-full mt-4" @submit.prevent="handleSave">
          <div class="flex flex-col gap-4 mt-4">
            <div class="label flex-col items-start">
              Select Student:
              <Multiselect
                v-model="formData.selectedStudent"
                :options="studentsData"
                label="fullName"
                track-by="id"
                placeholder="Search by id, first name, last name or full name"
                :max-height="150"
                open-direction="below"
              >
                <template #noResult>
                  <span>Student Not Found.</span>
                </template>
              </Multiselect>
            </div>
            <div class="label flex-col items-start">
              Select Strand:
              <Multiselect
                v-model="formData.selectedStrand"
                :options="strands?.map((s) => ({ id: s.id, strand_name: s.strand_name })) ?? []"
                :searchable="false"
                label="strand_name"
                track-by="strand_name"
                placeholder=""
                open-direction="below"
              >
                <template #option="{ option }">
                  {{ option.strand_name }}
                </template>
                <template #singleLabel="{ option }">
                  {{ option.strand_name }}
                </template>
              </Multiselect>
            </div>

            <div class="label flex-col items-start">
              Select Grade Level:
              <Multiselect
                v-model="formData.selectedGradeLevel"
                :options="gradeLevels?.map((g) => ({ id: g.id, grade_level_name: g.grade_level_name })) ?? []"
                :searchable="false"
                label="grade_level_name"
                track-by="grade_level_name"
                placeholder=""
                open-direction="below"
              >
                <template #option="{ option }">
                  {{ option.grade_level_name }}
                </template>
                <template #singleLabel="{ option }">
                  {{ option.grade_level_name }}
                </template>
              </Multiselect>
            </div>
          </div>

          <div class="modal-action flex-col">
            <button
              type="submit"
              class="btn btn-accent w-full"
            >
              Submit Form
            </button>
            <button
              type="button"
              class="btn"
              @click="showFormModal = false"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </dialog>
    <dialog :open="showViewModal" class="modal">
      <div class="modal-box">
        <DashboardEnrollmentViewStudent
          v-if="enrolledStudentData"
          :student="enrolledStudentData"
          @show-modal="closeModal"
        />
      </div>
    </dialog>
    <ToastNotification
      :is-message="isMessage"
      :is-error="isError"
      :response-message="responseMessage"
    />
  </div>
</template>
