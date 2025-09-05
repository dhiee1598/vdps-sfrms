<script setup lang="ts">
import type { Sundries } from '~~/server/lib/zod-schema';

const props = defineProps<{
  formData: any;
  datas: any;
  sundries?: Sundries[];
}>();

const emit = defineEmits(['update:datas', 'update:formData']);
const inputAmount = ref(0);

const formData = computed({
  get: () => props.formData,
  set: value => emit('update:formData', value),
});

const datas = ref({ ...props.datas });
const localFormData = ref(props.formData);
const sundryList = ref(props.sundries);
const selectedPaymentOption = ref<string | null>(null);

const totalPayment = computed(() => {
  return formData.value.transaction_items.reduce((sum: any, item: any) => {
    return sum + (item.amount || 0);
  }, 0);
});

// Keep localFormData total_amount in sync
watch(totalPayment, (newTotal) => {
  localFormData.value.total_amount = newTotal;
});

watch(selectedPaymentOption, (newVal) => {
  localFormData.value.selected_payment_option = newVal;
});

watch(datas, (newVal) => {
  emit('update:datas', newVal);
});

watch(props.formData, (newVal) => {
  localFormData.value = newVal;
});

function togglePaymentOption(option: string) {
  formData.value.transaction_items = formData.value.transaction_items.filter(
    (i: any) => !datas.value.available_payment_option.includes(i.payment_type) || i.payment_type === option,
  );

  const existing = formData.value.transaction_items.find(
    (i: any) => i.payment_type === option,
  );

  if (!existing) {
    formData.value.transaction_items.push({
      payment_type: option,
      amount: 0.00,
    });
  }

  selectedPaymentOption.value = option;
  inputAmount.value = existing ? existing.amount : 0;
}

function toggleSundry(sundry: { sundry_name: string; sundry_amount: string }) {
  const items = formData.value.transaction_items;
  const existingIndex = items.findIndex(
    (item: any) => item.payment_type === sundry.sundry_name,
  );

  if (existingIndex !== -1) {
    items.splice(existingIndex, 1);
  }
  else {
    items.push({
      payment_type: sundry.sundry_name,
      amount: Number.parseFloat(sundry.sundry_amount) || 0,
    });
  }
}

watch(inputAmount, (newAmount) => {
  if (!selectedPaymentOption.value)
    return;

  const item = formData.value.transaction_items.find(
    (i: any) => i.payment_type === selectedPaymentOption.value,
  );

  if (item) {
    item.amount = newAmount;
  }
});

onMounted(() => {
  // restore payment option (Downpayment / Fullpayment)
  const existingPayment = formData.value.transaction_items.find((i: any) =>
    datas.value.available_payment_option.includes(i.payment_type),
  );

  if (existingPayment) {
    selectedPaymentOption.value = existingPayment.payment_type;
    inputAmount.value = existingPayment.amount;
  }
});
</script>

<template>
  <div class="flex flex-col gap-4 bg-base-100 border-base-300  rounded-box border p-4 mx-auto">
    <fieldset class="fieldset">
      <legend class="fieldset-legend text-lg">
        Choose Payment Option:
      </legend>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm py-2">
        <div v-for="(paymentOption, index) in datas.available_payment_option" :key="index">
          <label class="label">
            <input
              v-model="selectedPaymentOption"
              type="radio"
              class="radio"
              name="paymentOption"
              :value="paymentOption"
              @change="togglePaymentOption(paymentOption)"
            >
            {{ paymentOption }}
          </label>
        </div>
      </div>
    </fieldset>
    <div class="flex flex-row w-full gap-4">
      <div class="border rounded-lg overflow-hidden border-accent-content w-1/2">
        <h4 class="p-3 font-medium">
          Tuition & Fees Summary
        </h4>
        <div class="overflow-x-auto overflow-y-auto max-h-[180px]">
          <table class="table w-full text-sm table-sm">
            <thead>
              <tr>
                <th class="p-3 font-medium text-left">
                  Quarters
                </th>
                <th class="p-3 font-medium text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(balance, quarter) in datas.remaining_per_quarter"
                :key="quarter"
              >
                <td class="p-3">
                  {{ quarter }}
                </td>
                <td class="p-3 text-right">
                  ₱ {{ parseFloat(balance).toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="border rounded-lg overflow-hidden border-accent-content w-1/2">
        <h4 class="p-3 font-medium">
          Additionals
        </h4>
        <div class="overflow-x-auto overflow-y-auto max-h-[180px]">
          <table class="table w-full text-sm table-sm">
            <thead>
              <tr>
                <th class="p-3 font-medium text-left" />
                <th class="p-3 font-medium text-left">
                  Name
                </th>
                <th class="p-3 font-medium text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(sundry, index) in sundryList"
                :key="index"
              >
                <td>
                  <label>
                    <input
                      type="checkbox"
                      class="checkbox"
                      :checked="formData.transaction_items.some((i:any) => i.payment_type === sundry.sundry_name)"
                      @change="toggleSundry(sundry)"
                    >
                  </label>
                </td>
                <td class="p-3">
                  {{ sundry.sundry_name }}
                </td>
                <td class="p-3 text-right">
                  ₱ {{ parseFloat(sundry.sundry_amount).toFixed(2) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <div v-if="selectedPaymentOption" class="mt-2">
      <input
        v-model.number="inputAmount"
        type="number"
        class="input w-full"
        placeholder="Enter amount"
      >
    </div>
    <div class="text-right">
      Total Payment: ₱ {{ totalPayment.toFixed(2) }}
    </div>
  </div>
</template>
