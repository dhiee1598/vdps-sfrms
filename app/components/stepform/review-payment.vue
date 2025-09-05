<script setup lang="ts">
const props = defineProps<{
  formData: any;
  datas: any;
}>();
</script>

<template>
  <div class="flex flex-col items-center p-6">
    <h2 class="text-4xl font-extrabold mb-8 mt-4">
      Review Your Payment
    </h2>

    <div class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg space-y-6 border border-gray-200">
      <div class="bg-gray-50 p-4 rounded-lg border border-gray-100">
        <p class="text-sm text-gray-600">
          Student ID: <span class="font-medium text-gray-800">{{ props.formData.student_id }}</span>
        </p>
        <p class="text-sm text-gray-600">
          Student Name: <span class="font-medium text-gray-800">{{ props.datas.selected_students.name }}</span>
        </p>
      </div>

      <div class="space-y-3">
        <ul class="space-y-2">
          <li
            v-for="(item, index) in props.formData.transaction_items"
            :key="index"
            class="flex justify-between items-center text-base text-gray-600"
          >
            <template v-if="item.payment_type === 'Downpayment' || item.payment_type === 'Fullpayment' || item.payment_type === '1st Quarter' || item.payment_type === '2nd Quarter' || item.payment_type === '3rd Quarter' || item.payment_type === '4th Quarter'">
              <div class="flex flex-col w-full gap-2">
                <p class="text-lg font-semibold text-gray-700">
                  Tuition Fees
                </p>
                <div class="flex flex-row justify-between">
                  <span>{{ item.payment_type }}</span>
                  <span>₱{{ item.amount.toFixed(2) }}</span>
                </div>
              </div>
            </template>
          </li>
          <li v-if="!props.formData.transaction_items.some((item: { payment_type: string; }) => item.payment_type !== 'Downpayment' && item.payment_type !== 'Fullpayment' && item.payment_type !== '1st Quarter' && item.payment_type !== '2nd Quarter' && item.payment_type !== '3rd Quarter' && item.payment_type !== '4th Quarter')" class="text-sm italic text-gray-500">
            No Tuition fees selected.
          </li>
        </ul>
      </div>

      <div class="space-y-3">
        <p class="text-lg font-semibold   dark:text-gray-700">
          Additional Fees
        </p>
        <ul class="space-y-2">
          <li
            v-for="(item, index) in props.formData.transaction_items"
            :key="index"
            class="flex justify-between items-center text-base text-gray-600"
          >
            <template v-if="item.payment_type !== 'Downpayment' && item.payment_type !== 'Fullpayment' && item.payment_type !== '1st Quarter' && item.payment_type !== '2nd Quarter' && item.payment_type !== '3rd Quarter' && item.payment_type !== '4th Quarter'">
              <span>{{ item.payment_type }}</span>
              <span>₱{{ item.amount.toFixed(2) }}</span>
            </template>
          </li>
          <li v-if="!props.formData.transaction_items.some((item: { payment_type: string; }) => item.payment_type !== 'Downpayment' && item.payment_type !== 'Fullpayment' && item.payment_type !== '1st Quarter' && item.payment_type !== '2nd Quarter' && item.payment_type !== '3rd Quarter' && item.payment_type !== '4th Quarter')" class="text-sm italic text-gray-500">
            No additional fees selected.
          </li>
        </ul>
      </div>

      <div class="pt-4 border-t-2 border-gray-300 space-y-4">
        <div class="flex justify-between items-center">
          <p class="text-base text-gray-600">
            Payment Type
          </p>
          <p class="text-base font-medium text-gray-800">
            {{ props.formData.selected_payment_option }}
          </p>
        </div>
        <div class="flex justify-between items-end">
          <p class="text-2xl font-bold text-gray-800">
            Total Amount Due
          </p>
          <p class="text-4xl font-extrabold text-green-600">
            ₱{{ props.formData.total_amount.toFixed(2) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* You can add custom styles here if needed, or rely solely on Tailwind CSS */
/* For a "btn" class, you'd typically have a library like DaisyUI or similar integrated for default button styles. */
/* Assuming 'btn' and 'btn-success' are part of a TailwindCSS component library or defined globally. */
</style>
