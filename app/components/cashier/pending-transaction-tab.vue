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
      <div class="modal-box w-11/12 max-w-5xl">
        <h3 class="text-lg font-bold">
          Hello!
        </h3>
        <p class="py-4">
          Click the button below to close
        </p>
        <div class="modal-action">
          <form method="dialog">
            <!-- if there is a button, it will close the modal -->
            <div class="flex flex-row gap-2">
              <button class="btn btn-primary" @click="handleSubmit">
                Mark as paid
              </button>
              <button class="btn" @click="isOpen = false">
                Close
              </button>
            </div>
          </form>
        </div>
      </div>
    </dialog>
  </div>
</template>
