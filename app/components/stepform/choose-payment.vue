<script setup lang="ts">
const props = defineProps({
  datas: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:datas']);

const datas = ref({ ...props.datas });

watch(datas, (newVal) => {
  emit('update:datas', newVal);
});
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="border rounded-lg overflow-hidden border-accent-content">
      <h4 class="p-3 font-medium">
        Fees Breakdown
      </h4>
      <div class="overflow-x-auto overflow-y-auto max-h-[180px]">
        <table class="table w-full text-sm">
          <thead>
            <tr>
              <th class="p-3 font-medium text-left">
                ASDasdd
              </th>
              <th class="p-3 font-medium text-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(balance, quarter) in datas.remaining_per_quarter" :key="quarter">
              <td class="p-3">
                {{ quarter }}
              </td>
              <td class="p-3">
                ${{ balance.toFixed(2) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <fieldset class="fieldset bg-base-100 border-base-300 w-1/2 rounded-box border p-4 mx-auto">
      <legend class="fieldset-legend text-xl">
        Choose Payment Option:
      </legend>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm py-2">
        <div v-for="(paymentOption, index) in datas.available_payment_option" :key="index">
          <label class="label">
            <input
              type="checkbox"
              class="checkbox"
            >
            {{ paymentOption }}
          </label>
        </div>
      </div>
    </fieldset>
  </div>
</template>
