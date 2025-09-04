<script setup lang="ts">
import Multiselect from 'vue-multiselect'; // ✅ import the component
import 'vue-multiselect/dist/vue-multiselect.css'; // ✅ import styles

const isEditing = ref(false);
const showFormModal = ref(false);
const isSubmitting = ref(false);

// fetch students from backend
const { data: students } = await useFetch('/api/private/student');
const { data: semesters } = await useFetch('/api/private/semesters');
const { data: gradeLevels } = await useFetch('/api/private/grade-level');
const { data: strands } = await useFetch('/api/private/strands');
const { data: academicYears } = await useFetch('/api/private/academic-years');

const studentsData = computed(() =>
  (students.value?.data ?? []).map((student: any) => ({
    id: student.id,
    first_name: student.first_name,
    middle_name: student.middle_name,
    last_name: student.last_name,
    // build one nice label for display/search
    fullName: `${student.id} — ${student.first_name} ${student.middle_name ?? ''} ${student.last_name}`.trim(),
  })),
);

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

  console.warn('Saving with IDs only:', payload);

  // TODO: $fetch to backend
  // await $fetch('/api/private/masterlist', { method: 'POST', body: payload })

  isSubmitting.value = true;

  try {
    await $fetch('/api/private/masterlist', {
      method: 'POST',
      body: payload,
    });

    // if successful → close modal + reset form
    showFormModal.value = false;
    formData.value = { selectedStudent: null, selectedSemester: null, selectedGradeLevel: null, selectedStrand: null, selectedAcademicYear: null };
  }
  catch (err) {
    console.error(err);
  }
}
</script>

<template>
  <div class="w-full p-10">
    <div class="flex flex-row justify-between my-4 items-center">
      <p class="text-3xl">
        MASTERLIST
      </p>
      <div class="flex space-x-2">
        <input
          type="text"
          placeholder="Search students..."
          class="input input-bordered w-64"
        >
        <button class="btn btn-primary" @click="openAddStudentModal">
          <Icon name="solar:add-square-linear" size="24" /> Enroll Student
        </button>
      </div>
    </div>

    <!-- place the table here -->
    <DashboardMasterlistTable />

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
  </div>
</template>
