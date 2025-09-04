import db from '~~/server/db';
import { enrollments, enrollmentSelectSchema } from '~~/server/db/schema/enrollment-schema';
import { students } from '~~/server/db/schema/student-schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async () => {
  const allEnrollments = await db
    .select({
      enrollment: enrollments,
      student: students,
    })
    .from(enrollments)
    .leftJoin(students, eq(enrollments.student_id, students.id));

  return allEnrollments;
});
