<script setup lang="ts">
const { data: transactions, refresh } = await useFetch('/api/private/transactions');
console.warn(transactions.value);
const isOpen = ref(false);
const selectedItem = ref();

function openModal(item: any) {
  isOpen.value = true;
  selectedItem.value = item;
  console.warn(item);
}

async function handleSubmit() {
  if (!selectedItem.value) {
    console.warn('⚠️ No transaction selected');
    return;
  }
  const id = selectedItem.value.transaction.transaction_id;

  console.warn('selectedItem id', id);

  try {
    await $fetch(`/api/private/transactions/${id}`, {
      method: 'PUT',
      body: { status: 'paid' },
    });

    isOpen.value = false;
    selectedItem.value = null;
  }
  catch (err) {
    console.error('❌ Failed to update transaction:', err);
  }
  refresh();
}
</script>

<template>
  <div class="p-2 w-full">
    <div class="flex flex-row justify-between my-4">
      <h2 class="text-3xl">
        Pending Transactions
      </h2>
    </div>
    <div class="overflow-x-auto">
      <table class="table w-full">
        <thead>
          <tr>
            <th class="">
              transaction id
            </th>
            <th class="">
              Student Id
            </th>
            <th class="">
              Student Name
            </th>
            <th class="">
              Status
            </th>
            <th class="">
              Amount
            </th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in transactions?.data.filter(t => t.transaction.status === 'pending')"
            :key="item.transaction.transaction_id"
          >
            <td>{{ item.transaction.transaction_id }}</td>
            <td>{{ item.student.id }}</td>
            <td>{{ item.student.first_name }} {{ item.student.last_name }}</td>
            <td>{{ item.transaction.status }}</td>
            <td>{{ item.transaction.total_amount }}</td>
            <td>
              <button class="btn btn-sm btn-primary" @click="openModal(item)">
                <Icon
                  name="solar:eye-linear"
                  size="20"
                />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <dialog :open="isOpen" class="modal">
      <div class="modal-box w-11/12 max-w-5xl bg-base-200 text-base-content rounded-xl shadow-xl">
        <!-- Header -->
        <div class="flex items-center justify-between border-b border-base-300 pb-3">
          <h3 class="text-xl font-semibold flex items-center gap-2">
            <Icon
              name="mdi:file-document-outline"
              size="22"
              class="text-primary"
            />
            Transaction Summary
          </h3>
          <button class="btn btn-sm btn-ghost" @click="isOpen = false">
            ✕
          </button>
        </div>

        <!-- Student & Enrollment Details -->
        <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-base-300 p-4 rounded-lg">
            <p class="text-sm text-gray-400 mb-2">
              Student Information
            </p>
            <ul class="text-sm space-y-1">
              <li><span class="font-medium">ID:</span> {{ selectedItem?.student.id }}</li>
              <li><span class="font-medium">Name:</span> {{ selectedItem?.student.first_name }} {{ selectedItem?.student.middle_name }} {{ selectedItem?.student.last_name }}</li>
              <li><span class="font-medium">Address:</span> {{ selectedItem?.student.address }}</li>
            </ul>
          </div>

          <div class="bg-base-300 p-4 rounded-lg">
            <p class="text-sm text-gray-400 mb-2">
              Enrollment Information
            </p>
            <ul class="text-sm space-y-1">
              <li><span class="font-medium">Grade Level:</span> {{ selectedItem?.grade_level.grade_level_name }}</li>
              <li><span class="font-medium">Strand:</span> {{ selectedItem?.strand.strand_name }}</li>
              <li><span class="font-medium">Semester:</span> {{ selectedItem?.semester.semester }}</li>
              <li><span class="font-medium">Academic Year:</span> {{ selectedItem?.academic_year.academic_year }}</li>
            </ul>
          </div>
        </div>

        <!-- Transaction Details -->
        <div class="mt-6 bg-base-300 p-4 rounded-lg">
          <p class="text-sm text-gray-400 mb-2">
            Transaction Details
          </p>
          <dl class="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm">
            <dt class="font-medium">
              Transaction ID:
            </dt>
            <dd class="truncate">
              {{ selectedItem?.transaction.transaction_id }}
            </dd>

            <dt class="font-medium">
              Status:
            </dt>
            <dd>
              <span class="badge badge-warning badge-sm">
                {{ selectedItem?.transaction.status }}
              </span>
            </dd>

            <dt class="font-medium">
              Total Amount:
            </dt>
            <dd class="text-primary font-semibold">
              ₱ {{ Number(selectedItem?.transaction.total_amount).toFixed(2) }}
            </dd>
          </dl>
        </div>

        <!-- Transaction Items Table -->
        <div class="mt-6">
          <p class="text-sm text-gray-400 mb-2">
            Payment Breakdown
          </p>
          <div class="overflow-x-auto">
            <table class="table w-full table-sm">
              <thead>
                <tr>
                  <th>Payment Type</th>
                  <th class="text-right">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in selectedItem?.transaction_items"
                  :key="item.id"
                >
                  <td>{{ item.item_type }}</td>
                  <td class="text-right">
                    ₱ {{ Number(item.amount).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-action flex justify-end gap-3 mt-6">
          <button class="btn btn-outline" @click="isOpen = false">
            Cancel
          </button>
          <button class="btn btn-primary" @click="handleSubmit">
            Mark as Paid
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>
