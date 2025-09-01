<template>
  <div class="p-10 container">
    <div class="flex flex-col gap-4">
      <p class="text-3xl font-bold">
        Cashier Dashboard
      </p>
      <p>
        Process student payments and manage transactions
      </p>
    </div>

    <div class="flex flex-row gap-4 my-4 w-full justify-between">
      <div class="card w-full card-md shadow-sm bg-green-100 text-green-800">
        <div class="card-body">
          <h2 class="card-title">
            Today's Collection
          </h2>
          <p class="text-5xl font-bold">
            P0.00
          </p><p>+0 transactions completed</p>
        </div>
      </div>

      <div class="card w-full card-md shadow-sm bg-amber-100 text-amber-800">
        <div class="card-body">
          <h2 class="card-title">
            Pending Slips
          </h2>
          <p class="text-5xl font-bold">
            0
          </p><p>awaiting payment processing</p>
        </div>
      </div>

      <div class="card w-full card-md shadow-sm bg-blue-100 text-blue-800">
        <div class="card-body">
          <h2 class="card-title">
            Completed Today
          </h2>
          <p class="text-5xl font-bold">
            0
          </p><p>Successfully processed payments</p>
        </div>
      </div>
    </div>

    <div>
      <p>RECENT TRANSACTIONS</p>
    </div>
  </div>
</template>
