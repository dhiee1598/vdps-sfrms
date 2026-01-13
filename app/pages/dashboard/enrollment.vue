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
const selectedGrade = ref('');
const selectedStrand = ref('');
const filteredSections = ref<any[]>([]);

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
  strand_name: '',
  date_enrolled: null,
  createdAt: null,
});

function closeModal() {
  enrolledStudentData.value = null;
  showViewModal.value = false;
}

// fetch students from backend
const { data: enrolledStudents, pending, error, refresh: refreshEnroll } = await useFetch('/api/private/enrollment', { lazy: true });
const { data: allStudents, refresh: refreshStudent } = await useFetch('/api/private/student?enrolled=true');
const { data: gradeLevels } = await useFetch('/api/private/grade-level');
const { data: strands } = await useFetch('/api/private/strands');
const { data: academicYears } = await useFetch('/api/private/academic-years?activeYear=true');
const { data: sections } = await useFetch('/api/private/section');

// Extract unique grade levels & strands for dropdown filters
const filteredGradeLevels = computed(() => {
  const set = new Set(enrolledStudents.value?.data.map(t => t.grade_level));
  return Array.from(set);
});

const filteredStrands = computed(() => {
  const set = new Set(enrolledStudents.value?.data.map(t => t.strand_name));
  return Array.from(set);
});

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
    fullName: `${student.id} — ${student.last_name}, ${student.first_name} ${student.middle_name}`.trim(),
  })),
);

const filteredStudents = computed(() => {
  if (!enrolledStudents.value?.data)
    return [];

  let result = enrolledStudents.value.data;

  // search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((t) => {
      const fullName = `${t.first_name} ${t.middle_name ?? ''} ${t.last_name}`.toLowerCase();
      return (
        t.student_id?.toLowerCase().includes(query)
        || fullName.includes(query)
      );
    });
  }

  // grade filter
  if (selectedGrade.value) {
    result = result.filter(
      t => (t.grade_level ?? '').toLowerCase().trim() === selectedGrade.value.toLowerCase().trim(),
    );
  }

  // strand filter
  if (selectedStrand.value) {
    result = result.filter(
      t => (t.strand_name ?? '').toLowerCase().trim() === selectedStrand.value.toLowerCase().trim(),
    );
  }

  return result;
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

const showStrand = computed(() => {
  const name = formData.value.selectedGradeLevel?.grade_level_name;
  if (typeof name !== 'string') {
    return false;
  }
  const lowerCaseName = name.trim().toLowerCase();
  return lowerCaseName === 'grade 11' || lowerCaseName === 'grade 12';
});

function openEditModal(item: any) {
  isEditing.value = true;
  const gradeLevelName = item.grade_level?.trim().toLowerCase() ?? '';
  const gradeLevelFound = gradeLevels.value?.find(g => g.grade_level_name.trim().toLowerCase() === gradeLevelName);

  if (gradeLevelFound && sections.value) {
    filteredSections.value = sections.value.data.filter((section) => {
      return section.grade_level_id === Number(gradeLevelFound.id);
    });
  }

  const strandName = item.strand_name?.trim().toLowerCase() ?? '';
  const strandFound = strands.value?.find(s => s.strand_name.trim().toLowerCase() === strandName);

  const sectionName = item.section_name?.trim().toLowerCase() ?? '';
  const sectionFound = sections.value?.data.find(s => s.section_name.trim().toLowerCase() === sectionName);

  const academicYear = item.academic_year?.trim().toLowerCase() ?? '';
  const academicYearFound = academicYears.value?.data.find(ay => ay.academic_year.trim().toLowerCase() === academicYear);

  formData.value = {
    selectedStudent: {
      id: item.student_id,
      first_name: item.first_name,
      middle_name: item.middle_name,
      last_name: item.last_name,
      fullName: `${item.student_id} — ${item.last_name}, ${item.first_name} ${item.middle_name}`.trim(),
    },
    selectedGradeLevel: {
      id: gradeLevelFound?.id ?? undefined,
      grade_level_name: gradeLevelFound?.grade_level_name ?? '',
    },
    selectedSection: {
      id: sectionFound?.id ?? undefined,
      section_name: sectionFound?.section_name ?? '',
    },
    selectedStrand: {
      id: strandFound?.id ?? undefined,
      strand_name: strandFound?.strand_name ?? '',
    },
    selectedAcademicYear: {
      id: academicYearFound?.id ?? undefined,
      academic_year: academicYearFound?.academic_year ?? '',
    },
  };
  showFormModal.value = true;
}

// reactive form state
const formData = ref({
  selectedStudent: { id: '', first_name: '', middle_name: '', last_name: '' },
  selectedGradeLevel: { id: '', grade_level_name: '' },
  selectedSection: { id: '', section_name: '' },
  selectedStrand: { id: '', strand_name: '' },
  selectedAcademicYear: { id: '', academic_year: '' },
});

function openAddStudentModal() {
  showFormModal.value = true;
  isEditing.value = false;
  formData.value = {
    selectedStudent: { id: '', first_name: '', middle_name: '', last_name: '' },
    selectedGradeLevel: { id: '', grade_level_name: '' },
    selectedSection: { id: '', section_name: '' },
    selectedStrand: { id: '', strand_name: '' },
    selectedAcademicYear: { id: '', academic_year: '' },
  };
}

async function handleSave() {
  if (!formData.value.selectedStudent || !formData.value.selectedStudent.id) {
    showMessage('Please select a student to enroll.', true);
    isSubmitting.value = false;
    return;
  }

  let strandId = null;
  if (formData.value.selectedGradeLevel && ['Grade 11', 'Grade 12'].includes(formData.value.selectedGradeLevel.grade_level_name)) {
    strandId = formData.value.selectedStrand?.id;
  }

  // build payload here → only IDs
  const payload = {
    student_id: formData.value.selectedStudent?.id,
    grade_level_id: formData.value.selectedGradeLevel?.id,
    strand_id: strandId,
    academic_year_id: isEditing.value
      ? formData.value.selectedAcademicYear?.id
      : academicYears.value?.data[0]?.id,
    section_id: formData.value.selectedSection?.id,
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
    formData.value = {
      selectedStudent: { id: '', first_name: '', middle_name: '', last_name: '' },
      selectedGradeLevel: { id: '', grade_level_name: '' },
      selectedSection: { id: '', section_name: '' },
      selectedStrand: { id: '', strand_name: '' },
      selectedAcademicYear: { id: '', academic_year: '' },
    };
    showMessage(response.message, false);
    await refreshEnroll();
    await refreshStudent();
  }
  catch (e) {
    const error = e as FetchError;
    showMessage(error.data.message || 'An unexpected error occurred.', true);
  }
}

watch([searchQuery, selectedGrade, selectedStrand], () => {
  currentPage.value = 1;
});

watch(() => formData.value.selectedGradeLevel?.id, (newVal) => {
  if (newVal && sections.value) {
    filteredSections.value = sections.value.data.filter((section) => {
      return section.grade_level_id === Number(newVal);
    });
  }
});
</script>

<template>
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4 items-center">
      <p class="text-3xl">
        List of Enrolled Students
      </p>
      <div class="flex justify-end">
        <button class="btn btn-accent" @click="openAddStudentModal">
          <Icon name="solar:add-circle-linear" size="24" /> Enroll Student
        </button>
      </div>
    </div>
    <div class="flex space-x-2 justify-end">
      <select v-model="selectedGrade" class="select select-bordered w-44">
        <option value="">
          All Grades
        </option>
        <option
          v-for="(grade, index) in filteredGradeLevels"
          :key="index"
          :value="grade"
        >
          {{ grade }}
        </option>
      </select>
      <select v-model="selectedStrand" class="select select-bordered w-44">
        <option value="">
          All Strands
        </option>
        <option
          v-for="(strand, index) in filteredStrands"
          :key="index"
          :value="strand"
        >
          {{ strand }}
        </option>
      </select>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search students..."
        class="input input-bordered w-72"
      >
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Full Name</th>
          <th>Academic Year</th>
          <th>Strand</th>
          <th>Grade Level</th>
          <th>Section</th>
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
          <td>{{ item?.student_id }}</td>
          <td>{{ item?.last_name }}, {{ item?.first_name }} {{ item?.middle_name }}</td>
          <td>{{ item?.academic_year }}</td>
          <td>{{ item?.strand_name }}</td>
          <td class="capitalize">
            {{ item?.grade_level }}
          </td>
          <td>{{ item?.section_name }}</td>
          <td>{{ item.enroll_status }}</td>
          <td class="flex gap-2 justify-center items-center">
            <button
              class="btn btn-sm btn-success tooltip tooltip-success"
              data-tip="View"
              @click="openViewModal(item)"
            >
              <Icon name="solar:eye-linear" size="16" />
            </button>
            <button
              class="btn btn-sm btn-info tooltip tooltip-info"
              data-tip="Edit"
              @click="openEditModal(item)"
            >
              <Icon name="solar:pen-new-square-linear" size="16" />
            </button>
          </td>
        </tr>
        <tr v-if="paginatedStudents.length === 0">
          <td colspan="8" class="text-center text-gray-500 py-4">
            No Students found
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
          :class="{ 'btn-accent': currentPage === page }"
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
          {{ isEditing ? 'Edit Enrollment Form' : 'New Enrollment Form' }}
        </h3>
        <div class="flex flex-col">
          <div class="font-light">
            Year: {{ academicYears?.data[0]?.academic_year }}
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
                placeholder="Search by last name"
                :max-height="150"
                open-direction="below"
                :disabled="isEditing"
              >
                <template #noResult>
                  <span>Student Not Found.</span>
                </template>
              </Multiselect>
            </div>
            <div v-if="showStrand" class="label flex-col items-start">
              Select Strand:
              <Multiselect
                v-model="formData.selectedStrand"
                :options="strands?.map((s) => ({ id: s.id, strand_name: s.strand_name })) ?? []"
                :searchable="false"
                label="strand_name"
                track-by="strand_name"
                placeholder=""
                open-direction="below"
                :max-height="150"
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
                :max-height="150"
              >
                <template #option="{ option }">
                  {{ option.grade_level_name }}
                </template>
                <template #singleLabel="{ option }">
                  {{ option.grade_level_name }}
                </template>
              </Multiselect>
            </div>

            <div v-if="formData.selectedGradeLevel.id !== ''" class="label flex-col items-start">
              Select Section:
              <Multiselect
                v-model="formData.selectedSection"
                :options="filteredSections?.map((g:any) => ({ id: g.id, section_name: g.section_name })) ?? []"
                :searchable="false"
                label="section_name"
                track-by="section_name"
                placeholder=""
                open-direction="below"
                :max-height="150"
              >
                <template #option="{ option }">
                  {{ option.section_name }}
                </template>
                <template #singleLabel="{ option }">
                  {{ option.section_name }}
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
              @click="() => {
                formData.selectedStudent = { id: '', first_name: '', middle_name: '', last_name: '' };
                formData.selectedGradeLevel = { id: '', grade_level_name: '' };
                formData.selectedSection = { id: '', section_name: '' };
                formData.selectedStrand = { id: '', strand_name: '' };
                formData.selectedAcademicYear = { id: '', academic_year: '' };
                filteredSections.value = [];
                showFormModal = false;
              }"
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
