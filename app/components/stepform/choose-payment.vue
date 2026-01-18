<script setup lang="ts">
import type { Sundries } from '~~/server/lib/zod-schema';

const props = defineProps<{
  formData: any;
  datas: any; // Contains overall_balance, remaining_per_month, available_payment_option etc.
  sundries?: Sundries[];
}>();

const emit = defineEmits(['update:datas', 'update:formData']);

// Use a ref for the numeric input to avoid string/number conflicts
const inputAmount = ref<number | string>("");

// Two-way binding helper for formData
const formData = computed({
  get: () => props.formData,
  set: value => emit('update:formData', value),
});

const datas = ref({ ...props.datas });
const localFormData = ref(props.formData);
const sundryList = ref(props.sundries);
const selectedPaymentOption = ref<string | null>(null);

// 1. Calculate Total (Reactive)
const totalPayment = computed(() => {
  const sum = formData.value.transaction_items.reduce((sum: number, item: any) => {
    return sum + (Number(item.amount) || 0);
  }, 0);
  // Fix precision on total display
  return Math.round((sum + Number.EPSILON) * 100) / 100;
});

// Sync Total to Form Data
watch(totalPayment, (newTotal) => {
  localFormData.value.total_amount = newTotal;
});

// Sync Data Props (Important for when student selection changes)
watch(() => props.datas, (newVal) => {
  datas.value = newVal;
  // Reset selection when student changes
  selectedPaymentOption.value = null;
  inputAmount.value = "";
}, { deep: true });

// 2. Logic to Switch Payment Option
function togglePaymentOption(option: string) {
  // Remove conflicting types (e.g. switching from June to July)
  // We keep 'Sundries' but remove the main 'Tuition/Month' option being replaced
  formData.value.transaction_items = formData.value.transaction_items.filter(
    (i: any) => !datas.value.available_payment_option.includes(i.item_type) || i.item_type === option,
  );

  // Find or Create Item in the transaction list
  let existing = formData.value.transaction_items.find(
    (i: any) => i.item_type === option,
  );

  if (!existing) {
    existing = {
      item_type: option,
      amount: 0, 
    };
    formData.value.transaction_items.push(existing);
  }

  selectedPaymentOption.value = option;

  // 3. Determine Default Amount
  let amountToSet = 0;
  
  if (option === 'Full Payment') {
    amountToSet = datas.value.overall_balance;
  } 
  else if (datas.value.remaining_per_month && datas.value.remaining_per_month[option]) {
    // Default to the specific month's remaining balance
    amountToSet = datas.value.remaining_per_month[option];
  } 
  else {
    amountToSet = existing.amount;
  }

  // Set the input field
  inputAmount.value = Number(amountToSet).toFixed(2);
  updateTransactionAmount(Number(amountToSet));
}

function updateTransactionAmount(val: number) {
  if (!selectedPaymentOption.value) return;

  const item = formData.value.transaction_items.find(
    (i: any) => i.item_type === selectedPaymentOption.value,
  );
  if (item) {
    item.amount = val;
  }
}

// 4. Handle Sundries
function toggleSundry(sundry: { sundry_name: string; sundry_amount: string }) {
  const items = formData.value.transaction_items;
  const existingIndex = items.findIndex(
    (item: any) => item.item_type === sundry.sundry_name,
  );

  if (existingIndex !== -1) {
    items.splice(existingIndex, 1);
  } else {
    items.push({
      item_type: sundry.sundry_name,
      amount: Number(sundry.sundry_amount) || 0,
    });
  }
}

// 5. VALIDATION & INPUT WATCHER
watch(inputAmount, (newVal) => {
  if (!selectedPaymentOption.value) return;

  let val = Number(newVal);
  // Max allowed is the TOTAL balance of the student
  const maxAllowed = Number(datas.value.overall_balance);

  // Rule A: Negative Check
  if (val < 0) val = 0;

  // Rule B: Max Balance Check
  if (val > maxAllowed) {
    val = maxAllowed;
  }

  updateTransactionAmount(val);
});

// Initial Setup
onMounted(() => {
  // If editing an existing transaction, pre-select the option
  const existingPayment = formData.value.transaction_items.find((i: any) =>
    datas.value.available_payment_option.includes(i.item_type),
  );

  if (existingPayment) {
    selectedPaymentOption.value = existingPayment.item_type;
    inputAmount.value = existingPayment.amount;
  }
});
</script>

<template>
  <div class="flex flex-col gap-4 mx-auto">
    <fieldset class="fieldset bg-base-100 p-4 border border-base-300 rounded-lg">
      <legend class="fieldset-legend text-lg font-bold px-2">
        Choose Payment Option:
      </legend>
      <div class="flex flex-wrap gap-2">
        <div v-for="(paymentOption, index) in datas.available_payment_option" :key="index">
          <label 
            class="btn btn-sm" 
            :class="selectedPaymentOption === paymentOption ? 'btn-primary' : 'btn-outline'"
          >
            <input
              type="radio"
              class="hidden"
              name="paymentOption"
              :value="paymentOption"
              :checked="selectedPaymentOption === paymentOption"
              @change="togglePaymentOption(paymentOption)"
            >
            {{ paymentOption }}
          </label>
        </div>
      </div>
    </fieldset>

    <div class="flex flex-col md:flex-row w-full gap-4 justify-center">
      <div class="border rounded-lg w-full overflow-hidden border-accent-content">
        <h4 class="p-3 font-medium bg-base-200 sticky top-0">
          Monthly Breakdown
        </h4>
        <div class="overflow-x-auto overflow-y-auto max-h-[250px]">
          <table class="table w-full text-sm table-sm table-pin-rows">
            <thead>
              <tr>
                <th class="p-3 font-medium text-left bg-base-100">Month</th>
                <th class="p-3 font-medium text-right bg-base-100">Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(balance, month) in datas.remaining_per_month" :key="month">
                <td class="p-3">{{ month }}</td>
                <td class="p-3 text-right">
                   <span :class="{'opacity-40': balance <= 0, 'font-bold text-error': balance > 0}">
                      ₱ {{ Number(balance).toFixed(2) }}
                   </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="border rounded-lg w-full overflow-hidden border-accent-content">
        <h4 class="p-3 font-medium bg-base-200">Additionals</h4>
        <div class="overflow-x-auto overflow-y-auto max-h-[250px]">
          <table class="table w-full text-sm table-sm">
            <thead>
              <tr>
                <th class="w-10"></th>
                <th class="p-3 font-medium text-left">Name</th>
                <th class="p-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(sundry, index) in sundryList" :key="index">
                <td>
                  <label>
                    <input
                      type="checkbox"
                      class="checkbox checkbox-sm"
                      :checked="formData.transaction_items.some((i:any) => i.item_type === sundry.sundry_name)"
                      @change="toggleSundry(sundry)"
                    >
                  </label>
                </td>
                <td class="p-3">{{ sundry.sundry_name }}</td>
                <td class="p-3 text-right">₱ {{ parseFloat(sundry.sundry_amount).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="selectedPaymentOption" class="mt-2 form-control">
      <label class="label">
        <span class="label-text font-bold">Amount to Pay for {{ selectedPaymentOption }}:</span>
        <span class="label-text-alt text-gray-500">Max: ₱{{ datas.overall_balance?.toFixed(2) }}</span>
      </label>
      <input
        v-model="inputAmount"
        type="number"
        step="0.01"
        class="input input-bordered w-full font-mono text-lg"
        placeholder="Enter amount"
        :readonly="selectedPaymentOption === 'Full Payment'"
      >
      <label class="label">
        <span class="label-text-alt text-warning" v-if="Number(inputAmount) > datas.overall_balance">
          Amount cannot exceed total balance.
        </span>
      </label>
    </div>

    <div class="text-right text-xl font-bold mt-4">
      Total Payment: ₱ {{ totalPayment.toFixed(2) }}
    </div>
  </div>
</template>
