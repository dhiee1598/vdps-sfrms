<script setup lang="ts">
import type { FetchError } from "ofetch";

// Fetching data
const { data: gradeLevels } = await useFetch("/api/private/grade-level");
const { data: fees, refresh: refreshFees } = await useFetch("/api/private/fees");
const { data: strands } = await useFetch("/api/private/strands");

const { isMessage, isError, responseMessage, showMessage } = useNotification();

// Modal control
const showFeeTypeModal = ref(false);
const showGradeLevelFeeModal = ref(false);

// Editing state
const isEditingFeeType = ref(false);
const isEditingGradeLevelFee = ref(false);
const editingFeeTypeId = ref<number | null>(null);
const editingGradeLevelFeeId = ref<number | null>(null);

// Form data
const feeTypeFormData = ref({
  fee_name: "",
  fee_description: "",
});

const gradeLevelFeeFormData = ref<{
  grade_level_id: number | null;
  strand_id: number | null;
  fee_id: number | null;
  amount: string;
}>({
  grade_level_id: null,
  strand_id: null,
  fee_id: null,
  amount: "",
});
const formStrand = ref<any | null>(null);

// Filtering
const selectedGradeLevel = ref<any | null>(null);
const selectedStrand = ref<any | null>(null);

const {
  data: gradeLevelFees,
  pending,
  error,
  refresh: refreshGradeLevelFees,
} = useFetch(
  () => {
    if (!selectedGradeLevel.value) return "/api/private/grade-level-fees";
    let url = `/api/private/grade-level-fees?grade_level_id=${selectedGradeLevel.value.id}&is_shs=${selectedGradeLevel.value.is_shs}`;
    if (selectedGradeLevel.value.is_shs && selectedStrand.value) {
      url += `&strand_id=${selectedStrand.value.id}`;
    }
    return url;
  },
  { watch: [selectedGradeLevel, selectedStrand] }
);

async function handleFeeTypeSubmit() {
  let response;
  try {
    if (isEditingFeeType.value && editingFeeTypeId.value) {
      // UPDATE FEE TYPE
      response = await $fetch(`/api/private/fees/${editingFeeTypeId.value}`, {
        method: "PUT",
        body: feeTypeFormData.value,
      });
    } else {
      // CREATE FEE TYPE
      response = await $fetch("/api/private/fees", {
        method: "POST",
        body: feeTypeFormData.value,
      });
    }
    showMessage(response.message, false);
    await refreshFees();
    resetFeeTypeForm();
  } catch (err) {
    const error = err as FetchError;
    showMessage(error.data?.message || "An unexpected error occurred.", true);
  }
}

async function handleGradeLevelFeeSubmit() {
  let response;
  try {
    gradeLevelFeeFormData.value.grade_level_id = selectedGradeLevel.value?.id;
    gradeLevelFeeFormData.value.strand_id = formStrand.value?.id || null;

    // Frontend validation: if SHS, strand cannot be null
    if (selectedGradeLevel.value?.is_shs && !gradeLevelFeeFormData.value.strand_id) {
      showMessage("Strand is required for Senior High School grade levels.", true);
      return; // Prevent form submission
    }

    if (isEditingGradeLevelFee.value && editingGradeLevelFeeId.value) {
      // UPDATE GRADE LEVEL FEE
      response = await $fetch(
        `/api/private/grade-level-fees/${editingGradeLevelFeeId.value}`,
        {
          method: "PUT",
          body: gradeLevelFeeFormData.value,
        }
      );
    } else {
      // CREATE GRADE LEVEL FEE
      response = await $fetch("/api/private/grade-level-fees", {
        method: "POST",
        body: gradeLevelFeeFormData.value,
      });
    }
    showMessage(response.message, false);
    await refreshGradeLevelFees();
    resetGradeLevelFeeForm();
  } catch (err) {
    const error = err as FetchError;
    showMessage(error.data?.message || "An unexpected error occurred.", true);
  }
}

// Modal management functions
function openNewFeeTypeModal() {
  resetFeeTypeForm();
  showFeeTypeModal.value = true;
}

function openEditFeeTypeModal(fee: any) {
  isEditingFeeType.value = true;
  editingFeeTypeId.value = fee.id;
  feeTypeFormData.value = {
    fee_name: fee.fee_name,
    fee_description: fee.fee_description,
  };
  showFeeTypeModal.value = true;
}

function openNewGradeLevelFeeModal() {
  if (!selectedGradeLevel.value) {
    showMessage("Please select a grade level first.", true);
    return;
  }
  resetGradeLevelFeeForm();
  showGradeLevelFeeModal.value = true;
}

function openEditGradeLevelFeeModal(fee: any) {
  isEditingGradeLevelFee.value = true;
  editingGradeLevelFeeId.value = fee.id;
  gradeLevelFeeFormData.value = {
    grade_level_id: fee.grade_level_id,
    strand_id: fee.strand_id,
    fee_id: fee.fee_id,
    amount: fee.amount,
  };
  formStrand.value =
    strands.value?.find((s: any) => s.id === fee.strand_id) || null;
  showGradeLevelFeeModal.value = true;
}

function resetFeeTypeForm() {
  isEditingFeeType.value = false;
  editingFeeTypeId.value = null;
  feeTypeFormData.value = { fee_name: "", fee_description: "" };
  showFeeTypeModal.value = false;
}

function resetGradeLevelFeeForm() {
  isEditingGradeLevelFee.value = false;
  editingGradeLevelFeeId.value = null;
  gradeLevelFeeFormData.value = {
    grade_level_id: null,
    strand_id: null,
    fee_id: null,
    amount: "",
  };
  formStrand.value = null;
  showGradeLevelFeeModal.value = false;
}
</script>

<template>
  <div class="p-10 w-full">
    <div class="flex flex-row justify-between my-4 items-center">
      <h2 class="text-3xl">Grade Level Fees</h2>
      <div class="flex gap-2">
        <button class="btn btn-primary" @click="openNewFeeTypeModal">
          <Icon name="solar:add-circle-linear" size="24" />New Fee Type
        </button>
        <button
          class="btn btn-accent"
          :disabled="!selectedGradeLevel"
          @click="openNewGradeLevelFeeModal"
        >
          <Icon name="solar:add-circle-linear" size="24" />Add Grade Level Fee
        </button>
      </div>
    </div>

    <div class="flex flex-row gap-4">
      <div class="w-1/3 my-4">
        <Multiselect
          v-model="selectedGradeLevel"
          :options="gradeLevels || []"
          label="grade_level_name"
          track-by="id"
          placeholder="Select a Grade Level"
          @clear="selectedStrand = null"
        />
      </div>
      <div v-if="selectedGradeLevel?.is_shs" class="w-1/3 my-4">
        <Multiselect
          v-model="selectedStrand"
          :options="strands || []"
          label="strand_name"
          track-by="id"
          placeholder="Select a Strand"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex justify-center items-center py-10">
      <span class="loading loading-spinner loading-lg text-primary" />
    </div>
    <!-- Error -->
    <div v-else-if="error" class="alert alert-error shadow-lg">
      <span>Failed to load fees: {{ error.message }}</span>
    </div>
    <!-- Empty -->
    <div
      v-else-if="!selectedGradeLevel"
      class="flex justify-center items-center py-10 shadow-lg"
    >
      <span class="font-bold"
        >Please select a grade level to see the fees.</span
      >
    </div>
    <div
      v-else-if="!gradeLevelFees?.data || gradeLevelFees?.data.length === 0"
      class="flex justify-center items-center py-10 shadow-lg"
    >
      <span class="font-bold">NO FEES FOUND FOR THIS GRADE LEVEL</span>
    </div>

    <!-- Data Table -->
    <div v-else class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr>
            <th class="w-1/3">Fee Name</th>
            <th class="w-1/3">Strand</th>
            <th class="w-1/3">Amount</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in gradeLevelFees?.data" :key="item.id">
            <td>{{ item.fee_name }}</td>
            <td>{{ item.strand_name || "N/A" }}</td>
            <td>{{ item.amount }}</td>
            <td>
              <button
                class="btn btn-sm btn-info tooltip tooltip-info"
                data-tip="Update"
                @click="openEditGradeLevelFeeModal(item)"
              >
                <Icon name="solar:smartphone-update-broken" size="16" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Grade Level Fee MODAL -->
    <dialog :open="showGradeLevelFeeModal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{ isEditingGradeLevelFee ? "Update" : "Add" }} Fee for
          {{ selectedGradeLevel?.grade_level_name }}
        </h3>

        <form
          class="flex flex-col gap-4 w-full mt-4"
          method="dialog"
          @submit.prevent="handleGradeLevelFeeSubmit"
        >
          <fieldset
            v-if="selectedGradeLevel?.is_shs"
            class="fieldset"
          >
            <legend class="fieldset-legend">Strand (Optional)</legend>
            <Multiselect
              v-model="formStrand"
              :options="strands || []"
              label="strand_name"
              track-by="id"
              placeholder="Select a Strand"
            />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Fee Type</legend>
            <select
              v-model="gradeLevelFeeFormData.fee_id"
              class="select w-full"
              required
            >
              <option disabled selected :value="null">Select a fee</option>
              <option v-for="fee in fees?.data" :key="fee.id" :value="fee.id">
                {{ fee.fee_name }}
              </option>
            </select>
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend">Amount</legend>
            <input
              v-model="gradeLevelFeeFormData.amount"
              type="number"
              step="0.01"
              class="input w-full"
              placeholder="Type here"
              required
            />
          </fieldset>

          <div class="flex flex-row justify-end gap-2">
            <button type="submit" class="btn btn-accent">
              {{ isEditingGradeLevelFee ? "Update" : "Create" }}
            </button>
            <button
              type="button"
              class="btn"
              @click="resetGradeLevelFeeForm"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- Fee Type MODAL -->
    <dialog :open="showFeeTypeModal" class="modal">
      <div class="modal-box">
        <h3 class="text-lg font-bold">
          {{ isEditingFeeType ? "Update Fee Type" : "Add Fee Type" }}
        </h3>

        <form
          class="flex flex-col gap-4 w-full mt-4"
          method="dialog"
          @submit.prevent="handleFeeTypeSubmit"
        >
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Fee Name</legend>
            <input
              v-model="feeTypeFormData.fee_name"
              type="text"
              class="input w-full"
              placeholder="Type here"
              required
            />
          </fieldset>
          <fieldset class="fieldset">
            <legend class="fieldset-legend">Fee Description</legend>
            <input
              v-model="feeTypeFormData.fee_description"
              type="text"
              class="input w-full"
              placeholder="Type here"
            />
          </fieldset>

          <div class="flex flex-row justify-end gap-2">
            <button type="submit" class="btn btn-accent">
              {{ isEditingFeeType ? "Update" : "Create" }}
            </button>
            <button type="button" class="btn" @click="resetFeeTypeForm">
              Close
            </button>
          </div>
        </form>
      </div>
    </dialog>
  </div>
  <ToastNotification
    :is-message="isMessage"
    :is-error="isError"
    :response-message="responseMessage"
  />
</template>
