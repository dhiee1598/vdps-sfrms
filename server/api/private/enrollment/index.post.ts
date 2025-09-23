import db from '~~/server/db';
import { assessments } from '~~/server/db/schema/asesssment-schema';
import { enrollments, enrollmentsInsertSchema } from '~~/server/db/schema/enrollment-schema';
import { and, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  // Require a user session (send back 401 if no `user` key in session)
  await requireUserSession(event);

  const body = await readValidatedBody(event, enrollmentsInsertSchema.safeParse);

  if (!body.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: 'Invalid data provided. Please check the required fields.',
    });
  }

  const { student_id, strand_id, grade_level_id, semester_id, academic_year_id, section_id } = body.data;

  // Validate first the student if already have a record
  const [existingEnrollStudent] = await db.select()
    .from(enrollments)
    .where(and(
      eq(enrollments.student_id, student_id),
      eq(enrollments.strand_id, strand_id),
      eq(enrollments.grade_level_id, grade_level_id),
      eq(enrollments.academic_year_id, academic_year_id),
      eq(enrollments.semester_id, semester_id),
      eq(enrollments.section_id, section_id),
    ));

  if (existingEnrollStudent) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Conflict',
      message: 'Student already enrolled.',
    });
  }

  // Validate if student has remaining balance
  // if has a remaining balance dont enroll it.
  const [previousEnrollment] = await db.select()
    .from(enrollments)
    .leftJoin(assessments, eq(assessments.enrollment_id, enrollments.id))
    .where(eq(enrollments.student_id, student_id));

  if (previousEnrollment) {
    // Check if the total amount due and total paid is equal
    if (previousEnrollment.assessments) {
      const totalDue = Number.parseFloat(previousEnrollment.assessments?.total_amount_due ?? '0');
      const totalPaid = Number.parseFloat(previousEnrollment.assessments?.total_paid ?? '0');

      if (totalDue > totalPaid) {
        throw createError({
          statusCode: 422,
          statusMessage: 'Outstanding Balance',
          message: `Student has a previous assessment with an unpaid balance of ₱${(totalDue - totalPaid).toFixed(2)}.`,
        });
      }
    }
  }

  const [enrolledStudent] = await db.insert(enrollments).values({
    student_id,
    strand_id,
    grade_level_id,
    semester_id,
    academic_year_id,
    section_id,
  }).$returningId();

  return {
    success: true,
    data: enrolledStudent,
    message: 'Student Enrolled Successfully.',
  };
});
