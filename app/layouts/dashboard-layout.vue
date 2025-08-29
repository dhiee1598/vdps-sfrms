<template>
  <div>
    <AppNavBar />
    <div class="drawer drawer-open">
      <div class="drawer-toggle" />
      <div class="drawer-content flex justify-center items-center pt-16 pl-60">
        <slot />
      </div>
      <div class="drawer-side">
        <ul class="menu bg-base-200 text-base-content fixed min-h-screen w-60 px-4 py-20">
          <li class="menu-title">
            Menu
          </li>
          <li>
            <NuxtLink to="/dashboard" class="font-medium">
              <Icon name="solar:home-broken" size="25" /> Home
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
