<script setup lang="ts">
const props = defineProps<{
  formData: any;
  datas: any;
}>();

const emit = defineEmits(['update:datas', 'update:formData']);

// Fetch sundries internally
const { data: sundriesData } = useFetch('/api/private/sundries');

const sundryList = computed(() => sundriesData.value?.data || []);

// Two-way binding helper for formData
const formData = computed({
  get: () => props.formData,
  set: value => emit('update:formData', value),
});

const localFormData = ref(props.formData);

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

// 2. Handle Sundries
function toggleSundry(sundry: { sundry_name: string; sundry_amount: string }) {
  const items = formData.value.transaction_items;
  const existingIndex = items.findIndex(
    (item: any) => item.item_type === sundry.sundry_name,
  );

  if (existingIndex !== -1) {
    items.splice(existingIndex, 1);
  }
  else {
    items.push({
      item_type: sundry.sundry_name,
      amount: Number(sundry.sundry_amount) || 0,
    });
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 mx-auto w-full max-w-2xl">
    <div class="border rounded-lg w-full overflow-hidden border-accent-content">
      <h4 class="p-3 font-medium bg-base-200">
        Select Sundries / Additional Fees
      </h4>
      <div class="overflow-x-auto overflow-y-auto max-h-[400px]">
        <table class="table w-full text-sm table-sm">
          <thead>
            <tr>
              <th class="w-10" />
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
              class="hover:bg-base-100 cursor-pointer"
              @click.stop="toggleSundry(sundry)"
            >
              <td>
                <label>
                  <input
                    type="checkbox"
                    class="checkbox checkbox-sm"
                    :checked="formData.transaction_items.some((i:any) => i.item_type === sundry.sundry_name)"
                    @click.stop="toggleSundry(sundry)"
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

    <div class="text-right text-xl font-bold mt-4">
      Total Payment: ₱ {{ totalPayment.toFixed(2) }}
    </div>
  </div>
</template>
