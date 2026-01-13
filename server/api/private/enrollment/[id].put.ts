import db from "~~/server/db";
import {
  enrollments,
  enrollmentUpdateSchema,
} from "~~/server/db/schema/enrollment-schema";
import { eq } from "drizzle-orm";

export default defineEventHandler(async (event) => {
  await requireUserSession(event);

  const studentId = event.context.params?.id;

  if (!studentId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Student ID is required.",
    });
  }

  const body = await readValidatedBody(
    event,
    enrollmentUpdateSchema.safeParse,
  );

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid data provided. Please check the fields.",
    });
  }

  const { grade_level_id, strand_id, section_id, academic_year_id } = body.data;

  try {
    await db
      .update(enrollments)
      .set({
        grade_level_id,
        strand_id,
        section_id,
        academic_year_id,
      })
      .where(eq(enrollments.student_id, studentId));

    return {
      success: true,
      message: "Enrollment updated successfully.",
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Internal Server Error",
      message: "Failed to update enrollment.",
    });
  }
});
