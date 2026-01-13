<script setup lang="ts">
import type { Assessment } from '~~/server/lib/zod-schema';

const props = defineProps<{
  isEditing: boolean;
  assessment: Assessment;
}>();

const emit = defineEmits<{
  (e: 'update:assessment', value: Assessment): void;
  (e: 'showModal'): void;
  (e: 'submit', formData: Assessment): void;
}>();

const { data: students, refresh } = useFetch('/api/private/enrollment?withoutAssessment=true');
const localAssessment = ref(props.assessment);
const selectedStudents = ref();
const selectedGrade = ref<{id: number, grade_level_name: string} | null>(null);
const selectedSection = ref();
const fees = ref<any[]>([]);

const gradeLevels = computed(() => {
    if (!students.value) return [];
    const uniqueGradeLevels = Array.from(new Set(students.value.data.map((s: any) => JSON.stringify({ id: s.grade_level_id, grade_level_name: s.grade_level }))))
        .map((s: any) => JSON.parse(s));
    return uniqueGradeLevels;
});

const filteredSections = computed(() => {
  if (!students.value || !selectedGrade.value)
    return [];

  const grade = selectedGrade.value.grade_level_name;

  const sections = students.value.data
    .filter((s: any) => s.grade_level === grade && s.section_name)
    .map((s: any) => s.section_name);

  const uniqueSections = [...new Set(sections)];

  return uniqueSections.map(section => ({
    value: section,
    label: section,
  }));
});

const filteredStudents = computed(() => {
  if (!students.value || !selectedGrade.value || !selectedSection.value)
    return [];

  const grade = selectedGrade.value.grade_level_name;
  const section = selectedSection.value.value;

  return students.value.data.filter(
    (student:any) =>
      student.grade_level === grade
      && student.section_name === section,
  );
});

const formData = computed({
  get: () => props.assessment,
  set: value => emit('update:assessment', value),
});

const totalAmountDue = computed(() => {
  const sum = formData.value.fees.reduce((total, fee) => {
    return total + Number.parseFloat(fee.amount as string);
  }, 0);

  return sum.toFixed(2);
});

async function onSubmit() {
  emit('submit', formData.value);
}

watch(() => props.assessment, async (newVal) => {
  selectedStudents.value = [];
  localAssessment.value = newVal;
  await refresh();
});

watch(totalAmountDue, (newSum) => {
  formData.value.total_fees = Number(newSum);
});

watch(selectedGrade, async (newGrade) => {
  selectedSection.value = null;
  formData.value.fees = [];
  if (newGrade) {
    const { data } = await useFetch(`/api/private/grade-level-fees?grade_level_id=${newGrade.id}`);
    fees.value = data.value?.data || [];
  }
  else {
    fees.value = [];
  }
});

watch(selectedSection, (newVal) => {
  selectedSection.value = newVal;
});

watch(selectedStudents, (newVal) => {
  formData.value.enrollment_id = newVal.enrollmentId;
  formData.value.student_id = newVal.value;
});

function handleClose() {
  // ✅ clear form fields
  formData.value.enrollment_id = null;
  formData.value.student_id = '';
  formData.value.fees = [];
  formData.value.total_fees = 0;
  fees.value = [];

  // ✅ clear grade/section/student selections
  selectedGrade.value = null;
  selectedSection.value = null;
  selectedStudents.value = null;

  emit('showModal'); // tell parent to actually close the modal
}
</script>

<template>
  <div class="p-6">
    <div class="card w-full max-w-lg mx-auto">
      <h3 class="text-2xl font-bold text-center mb-6">
        Assess New Enrolled Student
      </h3>

      <form @submit.prevent="onSubmit">
        <div class="form-control mb-6">
          <label class="label mb-1">
            <span>Select a Grade Level:</span>
          </label>
          <Multiselect
            v-model="selectedGrade"
            :options="gradeLevels"
            label="grade_level_name"
            track-by="id"
          />

          <template v-if="selectedGrade">
            <label class="label mb-1 mt-2">
              <span>Select a Section:</span>
            </label>
            <Multiselect
              v-model="selectedSection"
              :options="filteredSections"
              label="label"
              track-by="value"
            />
          </template>

          <template v-if="selectedGrade && selectedSection">
            <label class="label mb-1">
              <span>Select a Student:</span>
            </label>
              <Multiselect
                v-model="selectedStudents"
                :options="filteredStudents.map((s: any) => ({
                  value: s.student_id,
                  enrollmentId: s.id,
                  name: `${s.first_name} ${s.middle_name} ${s.last_name}`,
                }))"
                label="name"
                track-by="value"
              />
          </template>
        </div>

        <fieldset class="fieldset bg-base-100 border-base-300 rounded-box w-full border p-4">
          <legend class="fieldset-legend text-2xl">
            List of Fees
          </legend>
          <div class="space-y-2">
            <div
              v-for="fee in fees"
              :key="fee.id"
            >
              <label class="label">
                <input
                  type="checkbox"
                  class="checkbox"
                  :checked="formData.fees.some((f: any) => f.id === fee.id)"
                  @change="(event) => {
                    const target = event.target as HTMLInputElement;
                    if (target.checked) {
                      formData.fees.push(fee);
                    }
                    else {
                      formData.fees = formData.fees.filter((f: any) => f.id !== fee.id);
                    }
                  }"
                >
                {{ fee.fee_name }} - ₱ {{ fee.amount }}
              </label>
            </div>
          </div>
        </fieldset>

        <div class="text-center text-lg font-bold mt-4 mb-6">
          Total Amount Due: <span class="pl-2">₱ {{ totalAmountDue }}</span>
        </div>

        <div class="flex flex-col justify-end gap-2 pt-2">
          <button
            type="submit"
            class="btn btn-accent"
          >
            {{ isEditing ? 'Update' : 'Submit Form' }}
          </button>
          <button
            type="button"
            class="btn"
            @click="handleClose"
          >
            Close
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
