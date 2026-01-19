import db from "~~/server/db";
import {
  enrollments,
  enrollmentsInsertSchema,
} from "~~/server/db/schema/enrollment-schema";
import { and, eq, isNull } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const body = await readValidatedBody(
    event,
    enrollmentsInsertSchema.safeParse,
  );

  if (!body.success) {
    if (!body.error.issues.find((issue) => issue.path.includes("student_id"))) {
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request",
        message: "Invalid data provided. Please check the required fields.",
      });
    }

    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Student ID is required for enrollment.",
    });
  }

  const {
    student_id,
    strand_id,
    grade_level_id,
    academic_year_id,
    section_id,
  } = body.data;

  const strandCondition = strand_id
    ? eq(enrollments.strand_id, strand_id)
    : isNull(enrollments.strand_id);

  const [existingEnrollStudent] = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.student_id, student_id),
        strandCondition,
        eq(enrollments.grade_level_id, grade_level_id),
        eq(enrollments.academic_year_id, academic_year_id),
        eq(enrollments.section_id, section_id),
      ),
    );

  if (existingEnrollStudent) {
    throw createError({
      statusCode: 409,
      statusMessage: "Conflict",
      message: "Student already enrolled.",
    });
  }

  const [enrolledStudent] = await db
    .insert(enrollments)
    .values({
      student_id,
      strand_id,
      grade_level_id,
      academic_year_id,
      section_id,
    })
    .$returningId();

  return {
    success: true,
    data: enrolledStudent,
    message: "Student Enrolled Successfully.",
  };
});
