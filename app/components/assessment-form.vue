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
const { data: strands } = useFetch('/api/private/strands');
const localAssessment = ref(props.assessment);
const selectedStudents = ref();
const selectedGrade = ref<{id: number, grade_level_name: string, is_shs: boolean, is_jhs: boolean} | null>(null);
const selectedSection = ref();
const selectedStrand = ref();
const fees = ref<any[]>([]);

// --- TOGGLES STATE ---
// We initialize these based on the prop if editing, otherwise false
const isEscGrant = ref(props.assessment.is_esc_grant || false);
const isCashDiscount = ref(props.assessment.is_cash_discount || false);

const gradeLevels = computed(() => {
    if (!students.value) return [];
    const jhsGrades = ["GRADE 7", "GRADE 8", "GRADE 9", "GRADE 10"];
    
    const uniqueGradeLevels = Array.from(new Set(students.value.data.map((s: any) => {
        const gName = s.grade_level.toUpperCase();
        const gradeLevel = {
            id: s.grade_level_id,
            grade_level_name: s.grade_level,
            is_shs: gName === 'GRADE 11' || gName === 'GRADE 12',
            is_jhs: jhsGrades.includes(gName)
        };
        return JSON.stringify(gradeLevel);
    })))
    .map((s: any) => JSON.parse(s));
    
    return uniqueGradeLevels;
});

const filteredSections = computed(() => {
  if (!students.value || !selectedGrade.value) return [];

  const grade = selectedGrade.value.grade_level_name;
  let sectionsData = students.value.data.filter(
    (s: any) => s.grade_level === grade && s.section_name,
  );

  if (selectedGrade.value.is_shs && selectedStrand.value) {
    sectionsData = sectionsData.filter(
      (s: any) => s.strand_id === selectedStrand.value.id,
    );
  }

  const uniqueSections = [...new Set(sectionsData.map((s: any) => s.section_name))];
  return uniqueSections.map(section => ({ value: section, label: section }));
});

const filteredStudents = computed(() => {
  if (!students.value || !selectedGrade.value || !selectedSection.value) return [];
  const grade = selectedGrade.value.grade_level_name;
  const section = selectedSection.value.value;

  return students.value.data.filter(
    (student:any) => student.grade_level === grade && student.section_name === section,
  );
});

const formData = computed({
  get: () => props.assessment,
  set: value => emit('update:assessment', value),
});

// --- UPDATED COMPUTATION LOGIC ---
const totalAmountDue = computed(() => {
  let sum = 0;

  formData.value.fees.forEach((fee: any) => {
    let amount = Number.parseFloat(fee.amount as string);

    // LOGIC 1: CASH DISCOUNT (Less 4% on Tuition Only)
    if (isCashDiscount.value && fee.fee_name === 'Tuition Fee') {
        amount = amount * 0.96; // Apply 4% discount
    }

    sum += amount;
  });

  // LOGIC 2: ESC GRANT (JHS only: Less 9,000 from total)
  if (selectedGrade.value?.is_jhs && isEscGrant.value) {
    sum = sum - 9000;
  }

  // Final check to prevent negative balance
  const finalTotal = Math.max(0, sum);

  // Apply Math.ceil() to round up to the nearest whole number (e.g., 33874.20 -> 33875)
  return Math.ceil(finalTotal).toFixed(2);
});

const escLabel = computed(() => {
    if (selectedGrade.value?.is_shs) return "Apply ESC Voucher (Waive Tuition)";
    if (selectedGrade.value?.is_jhs) return "Apply ESC Grant (Less ₱9,000)";
    return "Apply ESC Grant";
});

// --- SUBMIT HANDLER ---
async function onSubmit() {
  // Construct payload with explicit flags and calculated total
  const payload = {
      ...formData.value,
      is_esc_grant: isEscGrant.value,       // Pass the ESC status
      is_cash_discount: isCashDiscount.value, // Pass the Discount status
      total_amount_due: Number(totalAmountDue.value) // Pass the final rounded calculation
  };
  
  emit('submit', payload);
}

watch(() => props.assessment, async (newVal) => {
  selectedStudents.value = [];
  localAssessment.value = newVal;
  // Reset toggles based on existing data or default to false
  isEscGrant.value = newVal.is_esc_grant || false;
  isCashDiscount.value = newVal.is_cash_discount || false;
  await refresh();
});

watch(totalAmountDue, (newSum) => {
  formData.value.total_amount_due = Number(newSum);
});

// --- WATCHER FOR ESC TOGGLE ---
watch(isEscGrant, (val) => {
  if (!selectedGrade.value) return;

  // Sync to formData immediately for consistency
  formData.value.is_esc_grant = val;

  // SHS: Waive Tuition completely
  if (selectedGrade.value.is_shs) {
      if (val) {
        formData.value.fees = formData.value.fees.filter((f: any) => f.fee_name !== 'Tuition Fee');
        // If ESC is ON, Cash discount on tuition is irrelevant because tuition is gone
        isCashDiscount.value = false; 
      } else {
        const tuitionFee = fees.value.find((f: any) => f.fee_name === 'Tuition Fee');
        if (tuitionFee && !formData.value.fees.some((f: any) => f.id === tuitionFee.id)) {
            formData.value.fees.push(tuitionFee);
        }
      }
  }
  // JHS: Tuition stays, Math happens in `totalAmountDue`
});

// --- WATCHER FOR CASH DISCOUNT TOGGLE ---
watch(isCashDiscount, (val) => {
    formData.value.is_cash_discount = val;
});

// --- WATCHER FOR GRADE CHANGE ---
watch([selectedGrade, selectedStrand], async ([newGrade, newStrand]) => {
  selectedSection.value = null;
  formData.value.fees = [];
  isEscGrant.value = false;
  isCashDiscount.value = false;
  
  if (newGrade) {
    let url = `/api/private/grade-level-fees?grade_level_id=${newGrade.id}`;
    if (newGrade.is_shs) {
        url += `&is_shs=true`;
        if (newStrand) url += `&strand_id=${newStrand.id}`;
    }
    const { data } = await useFetch(url);
    fees.value = data.value?.data || [];
    formData.value.fees = [...fees.value];
  } else {
    fees.value = [];
  }
});

watch(selectedSection, (newVal) => {
  selectedSection.value = newVal;
});

watch(selectedStudents, (newVal) => {
  if (newVal) {
    formData.value.enrollment_id = newVal.enrollmentId;
    formData.value.student_id = newVal.value;
  }
});

function handleClose() {
  formData.value.enrollment_id = null;
  formData.value.student_id = '';
  formData.value.fees = [];
  formData.value.total_amount_due = 0;
  fees.value = [];
  selectedGrade.value = null;
  selectedSection.value = null;
  selectedStudents.value = null;
  selectedStrand.value = null;
  isEscGrant.value = false;
  isCashDiscount.value = false;
  emit('showModal');
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
          <label class="label mb-1"><span>Select a Grade Level:</span></label>
          <Multiselect v-model="selectedGrade" :options="gradeLevels" label="grade_level_name" track-by="id" />

          <template v-if="selectedGrade?.is_shs">
            <label class="label mb-1 mt-2"><span>Select a Strand:</span></label>
            <Multiselect v-model="selectedStrand" :options="strands || []" label="strand_name" track-by="id" />
          </template>

          <template v-if="selectedGrade">
            <label class="label mb-1 mt-2"><span>Select a Section:</span></label>
            <Multiselect v-model="selectedSection" :options="filteredSections" label="label" track-by="value" />
          </template>

          <template v-if="selectedGrade && selectedSection">
            <label class="label mb-1"><span>Select a Student:</span></label>
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

        <div v-if="fees.length > 0" class="flex flex-col gap-2 mb-4">
            
            <div v-if="selectedGrade?.is_shs || selectedGrade?.is_jhs" class="form-control p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <label class="cursor-pointer label">
                    <span class="label-text font-semibold text-blue-800">{{ escLabel }}</span> 
                    <input type="checkbox" class="toggle toggle-primary" v-model="isEscGrant" />
                </label>
            </div>

            <div v-if="formData.fees.some((f:any) => f.fee_name === 'Tuition Fee')" class="form-control p-3 bg-green-50 border border-green-200 rounded-lg">
                <label class="cursor-pointer label">
                    <span class="label-text font-semibold text-green-800">Full Cash Payment (4% Off Tuition)</span> 
                    <input type="checkbox" class="toggle toggle-success" v-model="isCashDiscount" />
                </label>
            </div>
        </div>

        <fieldset class="fieldset bg-base-100 border-base-300 rounded-box w-full border p-4">
          <legend class="fieldset-legend text-2xl">List of Fees</legend>
          <div class="space-y-2">
            <div v-for="fee in fees" :key="fee.id">
              <label class="label cursor-pointer">
                <span class="label-text">
                    {{ fee.fee_name }} - 
                    <span v-if="isCashDiscount && fee.fee_name === 'Tuition Fee'" class="font-bold text-green-600">
                        ₱ {{ (Number(fee.amount) * 0.96).toFixed(2) }} 
                        <span class="text-xs text-gray-400 line-through font-normal ml-1">₱{{ fee.amount }}</span>
                    </span>
                    <span v-else>₱ {{ fee.amount }}</span>
                </span>
                <input
                  type="checkbox"
                  class="checkbox"
                  :checked="formData.fees.some((f: any) => f.id === fee.id)"
                  @change="(event) => {
                    const target = event.target as HTMLInputElement;
                    if (target.checked) formData.fees.push(fee);
                    else formData.fees = formData.fees.filter((f: any) => f.id !== fee.id);
                  }"
                >
              </label>
            </div>
          </div>
        </fieldset>

        <div class="text-center text-lg font-bold mt-4 mb-6">
          Total Amount Due: <span class="pl-2">₱ {{ totalAmountDue }}</span>
        </div>

        <div class="flex flex-col justify-end gap-2 pt-2">
          <button type="submit" class="btn btn-accent">{{ isEditing ? 'Update' : 'Submit Form' }}</button>
          <button type="button" class="btn" @click="handleClose">Close</button>
        </div>
      </form>
    </div>
  </div>
</template>
