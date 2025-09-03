import db from '~~/server/db';
import { enrollments, enrollmentsInsertSchema } from '~~/server/db/schema/enrollment-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, enrollmentsInsertSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

  const { student_id, strand_id, gradeLevel_id, semester_id, academic_year_id } = body.data;

  const [createdCourse] = await db.insert(enrollments).values({
    student_id,
    strand_id,
    gradeLevel_id,
    semester_id,
    academic_year_id,

  }).$returningId();

  return {
    success: true,
    data: createdCourse,
  };
});
