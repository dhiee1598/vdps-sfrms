<script setup lang="ts">
import { computed, ref } from 'vue';

const { data: assessment } = await useFetch('/api/private/assessment');
console.warn(assessment);
// --- Computed: all students from API ---
const allStudents = computed(() =>
  (assessment.value?.data ?? []).map((s: any) => ({
    assessment_id: s.id,
    id: s.student?.id,
    name: `${s.student?.first_name ?? ''} ${s.student?.middle_name ?? ''} ${s.student?.last_name ?? ''}`.trim(),
  })),
);

// ✅ Step state
const step = ref(1);
const selectedOption = ref(''); // full | partial | downpayment
const selectedQuarter = ref('');
const customAmount = ref(0);
const selectedSundries = ref<any[]>([]);
const selectedStudent = ref<null | { assessment_id: number; id: number; name: string }>(null);
// --- Helpers ---
const studentAssessment = computed(() => {
  if (!selectedStudent.value)
    return null;
  return (assessment.value?.data ?? []).find(
    (s: any) => s.student?.id === selectedStudent.value?.id,
  );
});

// ✅ Step 2: Balance
const downpaymentPaid = computed(() =>
  (studentAssessment.value?.payments ?? []).some(
    (p: any) => p.payment_type === 'Downpayment' && p.status === 'paid',
  ),
);

const totalPaid = computed(() =>
  (studentAssessment.value?.payments ?? []).reduce(
    (sum: number, p: any) => sum + Number(p.amount ?? 0),
    0,
  ),
);

const outstandingBalance = computed(() => {
  return Math.max(Number(studentAssessment.value?.total_amount_due ?? 0) - totalPaid.value, 0);
});

// ✅ Step 3: Quarters
const quarterAmount = computed(() =>
  studentAssessment.value ? Number(studentAssessment.value.total_amount_due) / 4 : 0,
);
type Quarter = {
  name: string;
  amount: number;
  paid: number;
  balance: number;
  isLocked: boolean;
};

const quarters = computed<Quarter[]>(() => {
  const payments = studentAssessment.value?.payments ?? [];
  const quarterNames = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];

  const baseAmount = quarterAmount.value;
  let carryOver = 0;

  const result: Quarter[] = [];

  quarterNames.forEach((name, index) => {
    const paidForQuarter = payments
      .filter((p: any) => p.payment_type === name && p.status === 'paid')
      .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

    const totalPaidHere = paidForQuarter + carryOver;

    let balance = baseAmount - totalPaidHere;
    let excess = 0;

    if (balance < 0) {
      excess = Math.abs(balance);
      balance = 0;
    }

    carryOver = excess;

    result.push({
      name,
      amount: baseAmount,
      paid: paidForQuarter,
      balance,
      isLocked: index > 0 && (result[index - 1]?.balance ?? 0) > 0,
    });
  });

  return result;
});

// ✅ Step 4: Sundry (from API fees)
const sundries = computed(() => [
  { id: 1, name: 'Mock Sundry 1', amount: 100 },
  { id: 2, name: 'Mock Sundry 2', amount: 200 },
  { id: 3, name: 'Mock Sundry 3', amount: 300 },
  { id: 4, name: 'Mock Sundry 4', amount: 400 },
]);

// ✅ Reactive form data (computed so it's always up to date)
const formData = computed(() => ({
  assessment_id: studentAssessment.value?.id ?? null,
  student_id: selectedStudent.value?.id ?? null,
  payment_type: selectedOption.value === 'full'
    ? 'Full Payment'
    : selectedOption.value === 'downpayment'
      ? 'Downpayment'
      : selectedQuarter.value || null,
  amount: selectedOption.value === 'full' ? outstandingBalance.value : customAmount.value,
}));

// ✅ Submit
async function submitPayment() {
  console.warn(formData.value);
  try {
    await $fetch('/api/private/payments', {
      method: 'POST',
      body: formData.value,
    });
  }
  catch (err) {
    console.error(err);
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-200 flex items-center justify-center p-6">
    <div class="card bg-base-100 shadow-xl w-full max-w-3xl p-6">
      <!-- Step 1 -->
      <div v-if="step === 1">
        <h2 class="text-xl font-bold">
          Step 1: Enter Student Name
        </h2>
        <Multiselect
          v-model="selectedStudent"
          :options="allStudents"
          :searchable="true"
          label="name"
          track-by="id"
          placeholder="Search by name..."
          :max-height="200"
          class="w-full "
        />
        <button
          class="btn btn-primary mt-4 "
          :disabled="!selectedStudent"
          @click="step = 2"
        >
          Next
        </button>
      </div>

      <!-- Step 2 -->
      <div v-else-if="step === 2" class="w-full">
        <h2 class="text-xl font-bold">
          Step 2: Outstanding Balance
        </h2>
        <p class="mt-2">
          Balance: ₱{{ outstandingBalance }}
        </p>

        <h3 class="mt-4 font-semibold">
          Choose Payment Option:
        </h3>
        <div class="flex flex-col gap-2 mt-2 w-full">
          <label>
            <input
              v-model="selectedOption"
              type="radio"
              value="full"
            >
            Full Payment
          </label>
          <label v-if="!downpaymentPaid">
            <input
              v-model="selectedOption"
              type="radio"
              value="downpayment"
            >
            Downpayment
          </label>
          <label v-if="downpaymentPaid">
            <input
              v-model="selectedOption"
              type="radio"
              value="partial"
            >
            Partial (Quarterly)
          </label>
        </div>

        <button
          class="btn btn-primary mt-4"
          :disabled="!selectedOption"
          @click="step = 3"
        >
          Next
        </button>
      </div>

      <!-- Step 3 -->
      <div v-else-if="step === 3">
        <h2 class="text-xl font-bold">
          Step 3: Payment Details
        </h2>

        <!-- Full -->
        <div v-if="selectedOption === 'full'" class="mt-2">
          <p>You chose <b>Full Payment</b></p>
          <p>Amount: ₱{{ outstandingBalance }}</p>
        </div>

        <!-- Downpayment -->
        <div v-if="selectedOption === 'downpayment'" class="mt-2">
          <p>You chose <b>Downpayment</b></p>
          <input
            v-model="customAmount"
            type="number"
            placeholder="Enter downpayment amount"
            class="input input-bordered mt-2"
          >
        </div>

        <!-- partial -->
        <div v-if="selectedOption === 'partial'" class="mt-2">
          <p>You chose <b>Partial Payment</b></p>
          <div class="mt-2 space-y-2">
            <div
              v-for="(q, index) in quarters"
              :key="q.name"
              class="flex items-center gap-2"
            >
              <input
                v-model="selectedQuarter"
                type="radio"
                :value="q.name"
                :disabled="q.balance === 0 || (index > 0 && quarters[index - 1].balance > 0)"
              >

              <span>
                {{ q.name }} - Balance: ₱{{ q.balance }}
                <span v-if="q.balance === 0" class="text-green-600">✔ Paid</span>
              </span>
            </div>
          </div>

          <div v-if="selectedQuarter" class="mt-3">
            <input
              v-model="customAmount"
              type="number"
              placeholder="Enter payment amount"
              class="input input-bordered w-full"
            >
            <p class="text-sm mt-1 text-gray-500">
              💡 If you pay more than the required balance, excess will go to the next quarter automatically.
            </p>
          </div>
        </div>

        <button
          class="btn btn-primary mt-4"
          :disabled="selectedOption === 'partial' && !selectedQuarter"
          @click="step = 4"
        >
          Next
        </button>
      </div>

      <!-- Step 4 -->
      <div v-else-if="step === 4">
        <h2 class="text-xl font-bold">
          Step 4: Sundry Payments
        </h2>

        <div class="mt-2">
          <p>Select additional fees (optional):</p>
          <div class="flex flex-col gap-2 mt-2">
            <label
              v-for="s in sundries"
              :key="s.id"
              class="flex items-center gap-2"
            >
              <input
                v-model="selectedSundries"
                type="checkbox"
                :value="s"
                class="checkbox"
              >
              <span>{{ s.name }} - ₱{{ s.amount }}</span>
            </label>
          </div>
        </div>

        <button class="btn btn-success mt-4" @click="submitPayment">
          Submit Payment
        </button>
      </div>
    </div>
  </div>
</template>
