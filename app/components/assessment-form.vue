<script setup lang="ts">
import type { Assessment } from '~~/server/lib/zod-schema';

type StudentOption = {
  value: string;
  enrollmentId: number | null;
  name: string;
};

const props = defineProps<{
  isEditing: boolean;
  assessment: Assessment;
}>();

const emit = defineEmits<{
  (e: 'update:assessment', value: Assessment): void;
  (e: 'showModal'): void;
  (e: 'submit', formData: Assessment): void;
}>();

const { data: fees } = useFetch('/api/private/fees');
const { data: students } = useFetch('/api/private/enrollment?withoutAssessment=true');

const formData = computed({
  get: () => props.assessment,
  set: value => emit('update:assessment', value),
});

const localAssessment = ref(props.assessment);

const totalAmountDue = computed(() => {
  const sum = formData.value.fees.reduce((total, fee) => {
    return total + Number.parseFloat(fee.fee_amount as string);
  }, 0);

  return sum.toFixed(2);
});

watch(() => props.assessment, (newVal) => {
  localAssessment.value = newVal;
});

watch(totalAmountDue, (newSum) => {
  formData.value.total_fees = Number(newSum);
});

function onStudentSelect(selected: StudentOption | null) {
  formData.value.enrollment_id = selected ? selected.enrollmentId : null;
}
</script>

<template>
  <div class="p-6">
    <div class="card p-6 w-full max-w-lg mx-auto">
      <h3 class="text-2xl font-bold text-center mb-6">
        Student Assessment
      </h3>

      <form @submit.prevent="emit('submit', formData)">
        <div class="form-control mb-6">
          <label class="label mb-1">
            <span>Select a Student:</span>
          </label>
          <Multiselect
            v-model="formData.students"
            :options="(students?.data ?? []).map((s) => ({
              value: s.student_id,
              enrollmentId: s.id,
              name: `${s.first_name} ${s.middle_name} ${s.last_name}`,
            }))"
            label="name"
            track-by="value"
            @select="onStudentSelect"
          />
        </div>

        <fieldset class="fieldset bg-base-100 border-base-300 rounded-box w-full border p-4">
          <legend class="fieldset-legend text-2xl">
            List of Fees
          </legend>
          <div class="space-y-2">
            <div
              v-for="fee in fees?.data"
              :key="fee.id"
            >
              <label class="label">
                <input
                  type="checkbox"
                  class="checkbox"
                  :checked="formData.fees.some(f => f.id === fee.id)"
                  @change="(event) => {
                    const target = event.target as HTMLInputElement;
                    if (target.checked) {
                      formData.fees.push(fee);
                    }
                    else {
                      formData.fees = formData.fees.filter(f => f.id !== fee.id);
                    }
                  }"
                >
                {{ fee.fee_name }} - ₱{{ fee.fee_amount }}
              </label>
            </div>
          </div>
        </fieldset>

        <div class="text-right text-lg font-bold mt-4 mb-6">
          Total Amount Due: <span class="text-primary pl-2">₱{{ totalAmountDue }}</span>
        </div>

        <div class="flex flex-row justify-end gap-3 pt-2">
          <button
            type="button"
            class="btn btn-warning rounded-full shadow-md hover:shadow-lg transition-shadow"
            @click="emit('showModal')"
          >
            Close
          </button>
          <button
            type="submit"
            class="btn btn-primary rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            {{ isEditing ? 'Update' : 'Add' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
