<script setup lang="ts">
const session = useUserSession();
async function logout() {
  await session.clear();
  await navigateTo('/auth/login');
}
</script>

<template>
  <div class="navbar bg-base-100 shadow-sm fixed z-100">
    <div class="navbar-start">
      <img
        src="/vdps-logo.png"
        alt="Profile"
        height="56"
        width="56"
      >
      <div class="ml-2">
        <div class="text-xs font-bold md:text-xl">
          Student Financial Record Management System
        </div>
        <div class="font-light text-xs md:text-sm">
          Virgen Del Pilar School Rodriguez, Inc.
        </div>
      </div>
    </div>
    <div class="navbar-end">
      <div class="avatar">
        <div class="ring-accent ring-offset-base-100 w-9 rounded-full ring-2 ring-offset-2">
          <NuxtImg
            src="/default-profile.png"
            alt="Profile"
            height="36"
            width="36"
          />
        </div>
      </div>

      <button class="btn btn-ghost btn-circle ml-3" @click="logout">
        <div class="indicator tooltip tooltip-bottom" data-tip="Logout">
          <Icon name="solar:logout-3-bold-duotone" size="24" />
        </div>
      </button>
    </div>
  </div>
</template>
