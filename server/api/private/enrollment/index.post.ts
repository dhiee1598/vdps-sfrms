import db from '~~/server/db';
import { enrollments, enrollmentsInsertSchema } from '~~/server/db/schema/enrollment-schema';
import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, enrollmentsInsertSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

  const { student_id, strand_id, grade_level_id, semester_id, academic_year_id } = body.data;

  // Validate first the student if already have a record
  const [existingEnrollStudent] = await db.select()
    .from(enrollments)
    .where(and(
      eq(enrollments.student_id, student_id),
      eq(enrollments.strand_id, strand_id),
      eq(enrollments.grade_level_id, grade_level_id),
      eq(enrollments.academic_year_id, academic_year_id),
    ));

  if (existingEnrollStudent) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'Student already enrolled.',
    });
  }

  const [enrolledStudent] = await db.insert(enrollments).values({
    student_id,
    strand_id,
    grade_level_id,
    semester_id,
    academic_year_id,

  }).$returningId();

  return {
    success: true,
    data: enrolledStudent,
    message: 'Student Enrolled created successfully.',
  };
});
