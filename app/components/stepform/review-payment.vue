<script setup lang="ts">
const props = defineProps<{
  formData: any;
  datas: any;
}>();

// UPDATE: Include months in the tuition types list
const tuitionTypes = [
  'Downpayment', 
  'Full Payment',
  'June', 'July', 'August', 'September', 'October', 
  'November', 'December', 'January', 'February', 'March',
  'April', 'May' // Added just in case
];

const tuitionItems = computed(() =>
  props.formData.transaction_items.filter((item: { item_type: string; amount: number }) =>
    tuitionTypes.includes(item.item_type),
  ),
);

const additionalItems = computed(() =>
  props.formData.transaction_items.filter(
    (item: { item_type: string; amount: number }) =>
      !tuitionTypes.includes(item.item_type),
  ),
);
</script>

<template>
  <div class="flex flex-col items-center">
    <h2 class="text-2xl md:text-3xl font-bold mb-8 mt-4">
      Review Your Payment
    </h2>

    <div class="rounded-2xl shadow-xl p-8 w-full text-left max-w-lg space-y-6 border border-gray-200 bg-stone-200">
      <div class="bg-stone-200 py-2">
        <p class="text-sm text-gray-600">
          Student ID: <span class="font-medium text-gray-800">{{ props.formData.student_id }}</span>
        </p>
        <p class="text-sm text-gray-600">
          Student Name: <span class="font-medium text-gray-800">{{ props.datas.selected_students.student.first_name }} {{ props.datas.selected_students.student.last_name }}</span>
        </p>
        <p class="text-sm text-gray-600">
          Transaction ID: <span class="font-medium text-gray-800">{{ props.formData.transaction_id }}</span>
        </p>
      </div>

      <div class="space-y-3">
        <ul>
          <p class="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Tuition Fees
          </p>
          <template v-if="tuitionItems.length > 0">
            <li
              v-for="(item, index) in tuitionItems"
              :key="index"
              class="flex justify-between items-center text-base text-gray-600 py-1"
            >
              <div class="flex flex-row justify-between w-full">
                <span>{{ item.item_type }}</span>
                <span class="font-medium text-gray-800">₱ {{ Number(item.amount).toFixed(2) }}</span>
              </div>
            </li>
          </template>
          <li v-else class="text-gray-500 italic text-sm">
            No Tuition Fees Selected
          </li>
        </ul>
      </div>

      <div class="space-y-3">
        <ul>
          <p class="text-lg font-semibold text-gray-700 border-b border-gray-300 pb-1 mb-2">
            Additional Fees
          </p>
          <template v-if="additionalItems.length > 0">
            <li
              v-for="(item, index) in additionalItems"
              :key="index"
              class="flex justify-between items-center text-base text-gray-600 py-1"
            >
              <div class="flex flex-row justify-between w-full">
                <span>{{ item.item_type }}</span>
                <span class="font-medium text-gray-800">₱ {{ Number(item.amount).toFixed(2) }}</span>
              </div>
            </li>
          </template>
          <li v-else class="text-gray-500 italic text-sm">
            No Additional Fees Selected
          </li>
        </ul>
      </div>

      <div class="pt-4 border-t-2 border-gray-300 space-y-4">
        <div class="flex justify-between items-end">
          <p class="text-lg font-bold text-gray-800">
            Total Amount:
          </p>
          <p class="text-xl font-extrabold text-green-600">
            ₱ {{ Number(props.formData.total_amount).toFixed(2) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
