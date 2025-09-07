<script setup lang="ts">
import type { EnrolledStudent } from '~~/server/lib/zod-schema';

const props = defineProps<{
  student: EnrolledStudent;
}>();

const emit = defineEmits<{
  (e: 'showModal'): void;
}>();
console.warn(props.student, 'enrolled student');
</script>

<template>
  <!-- Header -->
  <div class="flex items-center justify-between border-b border-base-300 pb-3">
    <h3 class="text-xl font-semibold">
      Student Information
    </h3>
  </div>

  <!-- Student Info Grid -->
  <div class="flex flex-row gap-2 w-full my-2">
    <div class="flex flex-col bg-base-300 p-4 rounded-lg gap-4">
      <div class="flex flex-row items-center gap-2">
        <Icon name="solar:user-id-linear" size="24" />
        <p class="text-lg">
          Personal Details
        </p>
      </div>
      <div class="flex flex-col">
        <div class="flex flex-row items-center gap-2">
          <Icon name="solar:user-circle-linear" size="16" />
          <p class="text-sm text-gray-400">
            Student ID
          </p>
        </div>
        <p>
          {{ props.student.student_id }}
        </p>
      </div>
      <div class="flex flex-col">
        <div class="flex flex-row items-center gap-2">
          <icon name="solar:minimalistic-magnifer-linear" size="16" />
          <p class="text-sm text-gray-400">
            Full Name
          </p>
        </div>
        <p>
          {{ props.student.first_name }} {{ props.student.middle_name ?? '' }} {{ props.student.last_name }}
        </p>
      </div>

      <div class="flex flex-col">
        <div class="flex flex-row items-center gap-2">
          <icon name="solar:map-point-linear" size="16" />
          <p class="text-sm text-gray-400">
            Address
          </p>
        </div>
        <p>
          {{ props.student.address }}
        </p>
      </div>

      <div class="flex flex-col">
        <div class="flex flex-row items-center gap-2">
          <icon name="solar:phone-calling-rounded-linear" size="16" />
          <p class="text-sm text-gray-400">
            Contact Number
          </p>
        </div>
        <p>
          {{ props.student.contact_number }}
        </p>
      </div>
    </div>

    <div class="flex flex-col p-4 rounded-lg gap-4">
      <div class="flex flex-row items-center gap-2">
        <Icon name="solar:list-check-linear" size="24" />
        <p class="text-lg">
          Enrollment Details
        </p>
      </div>
      <div class="flex flex-col">
        <p class="text-sm text-gray-400">
          Grade Level
        </p>
        <p class="capitalize">
          {{ props.student.grade_level }}
        </p>
      </div>

      <div class="flex flex-col">
        <p class="text-sm text-gray-400">
          Strand
        </p>
        <p class="capitalize">
          {{ props.student.strand_name }}
        </p>
      </div>

      <div class="flex flex-col">
        <p class="text-sm text-gray-400">
          Semester
        </p>
        <p class="capitalize">
          {{ props.student.semester }}
        </p>
      </div>

      <div class="flex flex-col">
        <p class="text-sm text-gray-400">
          Academic Year
        </p>
        <p class="capitalize">
          {{ props.student.academic_year }}
        </p>
      </div>

      <!-- <ul class="text-sm space-y-1">
        <li><span class="font-medium">Grade Level:</span> {{ props.student.grade_level }}</li>
        <li><span class="font-medium">Strand:</span> {{ props.student.strand_name }}</li>
        <li><span class="font-medium">Semester:</span> {{ props.student.semester }}</li>
        <li><span class="font-medium">Academic Year:</span> {{ props.student.academic_year }}</li>
        <li>
          <span class="font-medium">Date Enrolled:</span>
          {{ props.student.date_enrolled ? new Date(props.student.date_enrolled).toLocaleDateString() : 'N/A' }}
        </li>
      </ul> -->
    </div>
  </div>

  <!-- Footer -->
  <div class="modal-action flex justify-between mt-6">
    <div class="flex flex-row items-center gap-2 bg-green-600 px-4 py-2 rounded-lg">
      <p class="capitalize text-white">
        enrolled {{ props.student.date_enrolled ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: '2-digit' }).format(new Date(props.student.date_enrolled)) : 'N/A' }}
      </p>
      <Icon
        name="solar:calendar-linear"
        size="24"
        class="text-white"
      />
    </div>
    <button class="btn btn-outline" @click="emit('showModal')">
      Close
    </button>
  </div>
</template>
